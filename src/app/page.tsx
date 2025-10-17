"use client";

import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useConnections,
} from "wagmi";
import Board from "@/components/flip/Board";
import Timer from "@/components/flip/Timer";
import RightTabs from "@/components/flip/RightTabs";
import { useFlipMatch } from "@/hooks/useFlipMatch";
import { useStorePurchases } from "@/hooks/useStorePurchases";
import { USDC, erc20Abi } from "@/lib/usdc";
import { TREASURY_ADDRESS } from "@/lib/constants";
import { useState, useCallback, useEffect, useMemo } from "react";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { useFaucet } from "@/hooks/useFaucet";
import { useFaucetEligibility } from "@/hooks/useFaucetEligibility";
import { useSpendPermission } from "@/hooks/useSpendPermission";
import { DEFAULT_BUDGET_USD } from "@/lib/constants";
import { Coins, Edit3 } from "lucide-react";
import UsernameModal from "@/components/UsernameModal";


function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connections = useConnections();
  const [_subAccount, universalAccount] = useMemo(() => {
    return connections.flatMap((connection) => connection.accounts);
  }, [connections]);

  // Get universal account balance
  const { data: universalBalance } = useBalance({
    address: universalAccount,
    token: USDC.address,
    query: {
      refetchInterval: 1000,
      enabled: !!universalAccount,
    },
  });

  // Check faucet eligibility based on balance
  const faucetEligibility = useFaucetEligibility(universalBalance?.value);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [toastId, setToastId] = useState<string | number | null>(null);

  const faucetMutation = useFaucet();
  const { remainingBudgetUsd, isRequesting, requestBudget } = useSpendPermission();
  const flip = useFlipMatch();
  const entryPurchase = useStorePurchases();
  const [playId, setPlayId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>("");

  // Only ONE useSendTransaction instance for user-initiated txs used below
  const {
    sendTransaction,
    data: hash,
    isPending: isTransactionPending,
    reset: resetTransaction,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Dedicated for entry fee transaction
  const {
    sendTransaction: sendEntryTransaction,
    data: entryHash,
    isPending: isEntryPending,
    reset: resetEntryTx,
  } = useSendTransaction();
  const {
    isLoading: isEntryConfirming,
    isSuccess: isEntryConfirmed,
    isError: isEntryError,
  } = useWaitForTransactionReceipt({ hash: entryHash });

  useEffect(() => {
    if (account.status === "connected" && account.address) {
      // Set a temporary username immediately
      setCurrentUsername(`Player_${account.address.slice(2, 8)}`);
      
      fetch("/api/users/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.address }),
      }).catch(() => {});

      // Pull inventory counts and hydrate local state
      fetch("/api/users/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.address }),
      })
        .then((r) => r.json())
        .then((d) => {
          console.log("User data from API:", d);
          if (d?.user) {
            flip.actions.setInventoryCounts(d.user.peekCount || 0, d.user.autoMatchCount || 0);
            // Only update username if we got a valid one from the database
            if (d.user.username) {
              console.log("Setting username from database:", d.user.username);
              setCurrentUsername(d.user.username);
            } else {
              console.log("No username in database, keeping default");
            }
          }
        })
        .catch(() => {});
    } else {
      // Reset username when disconnected
      setCurrentUsername("");
    }
  }, [account.status, account.address]);

  useEffect(() => {
    if (isEntryConfirmed && !flip.state.hasEntryPaid) {
      flip.actions.markEntryPaid();
      resetEntryTx();
    }
  // Only run effect on confirmation
  // eslint-disable-next-line
  }, [isEntryConfirmed, flip.state.hasEntryPaid, resetEntryTx, flip.actions]);

  // Start play when entry hash is present (idempotent)
  useEffect(() => {
    if (!playId && entryHash && account.address) {
      fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.address }),
      })
        .then((r) => r.json())
        .then((d) => setPlayId(d.playId))
        .catch(() => {});
    }
  }, [entryHash, playId, account.address]);

  // Submit final score when game completes
  useEffect(() => {
    if (flip.state.isComplete && playId && !hasSubmitted) {
      setHasSubmitted(true);
      setIsSubmittingScore(true);
      
      // Get user's username from the database before submitting
      fetch("/api/users/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.address }),
      })
        .then((r) => r.json())
        .then((userData) => {
          const username = userData?.user?.username || `Player_${account.address?.slice(2, 8)}`;
          
          return fetch("/api/game/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playId,
              endTimeMs: Date.now(),
              username,
              clientFinalTimeMs: flip.derived.finalTimeMs,
            }),
          });
        })
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.finalTimeMs === "number") {
            toast.success("Score submitted", { description: `Final: ${Math.round(d.finalTimeMs/10)/100}s` });
          }
        })
        .catch(() => {})
        .finally(() => setIsSubmittingScore(false));
    }
  }, [flip.state.isComplete, playId, hasSubmitted, account.address]);

  // Unlock on confirmation only
  useEffect(() => {
    if (isEntryConfirmed && !flip.state.hasEntryPaid) {
      flip.actions.markEntryPaid();
    }
  }, [isEntryConfirmed, flip.state.hasEntryPaid, flip.actions]);

  // Notify on failure
  useEffect(() => {
    if (isEntryError) {
      toast.error("Entry payment failed", { description: "Please try again" });
    }
  }, [isEntryError]);

  const handleSend = useCallback(async () => {
    if (!amount || !isAddress(toAddress)) {
      toast.error("Invalid input", {
        description: "Please enter a valid address and amount",
      });
      return;
    }

    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, parseUnits(amount, USDC.decimals)],
      });

      sendTransaction({
        to: USDC.address,
        data,
        value: 0n,
      });

      const toastId_ = toast("Sending USDC...", {
        description: `Sending ${amount} USDC to ${toAddress}`,
        duration: Infinity,
      });

      setToastId(toastId_);
      setIsDialogOpen(false);
      setAmount("");
      setToAddress("");
    } catch (_error) {
      toast.error("Transaction failed", {
        description: "Please try again",
      });
    }
  }, [amount, toAddress, sendTransaction]);

  useEffect(() => {
    if (isConfirmed && toastId !== null) {
      toast.success("Transaction successful!", {
        description: `Sent ${amount} USDC to ${toAddress}`,
        duration: 2000,
      });

      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetTransaction();
    }
  }, [isConfirmed, toastId, amount, toAddress, resetTransaction]);

  const handleFundAccount = useCallback(async () => {
    if (!universalAccount) {
      toast.error("No universal account found", {
        description: "Please make sure your wallet is properly connected",
      });
      return;
    }

    if (!faucetEligibility.isEligible) {
      toast.error("Not eligible for faucet", {
        description: faucetEligibility.reason,
      });
      return;
    }

    const fundingToastId = toast.loading("Requesting USDC from faucet...", {
      description: "This may take a few moments",
    });

    faucetMutation.mutate(
      { address: universalAccount },
      {
        onSuccess: (data) => {
          toast.dismiss(fundingToastId);
          toast.success("Account funded successfully!", {
            description: (
              <div className="flex flex-col gap-1">
                <span>USDC has been sent to your wallet</span>
                <a
                  href={data.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:opacity-80"
                >
                  View transaction
                </a>
              </div>
            ),
            duration: 5000,
          });
        },
        onError: (error) => {
          toast.dismiss(fundingToastId);
          const errorMessage =
            error instanceof Error ? error.message : "Please try again later";
          toast.error("Failed to fund account", {
            description: errorMessage,
          });
        },
      }
    );
  }, [universalAccount, faucetMutation, faucetEligibility]);

  return (
    <main className="min-h-screen">
      <div className="w-full mx-auto">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-balance">flipit</h1>
        </div>
        {/* Gems indicator as in screenshot */} 
        <div className="flex items-center gap-3">
          {/* <div className="bg-[#17212b] rounded-md px-4 py-2 flex items-center gap-2 shadow-sm" style={{
            minWidth: 110
          }}>
            <span className="flex items-center">
              <GemIcon className="w-6 h-6" />
            </span>
            <span className="text-xl font-bold text-white" style={{lineHeight: "1"}}>
              {game.gems}
            </span>
            <span className="ml-1 text-sm text-muted-foreground font-normal" style={{letterSpacing: 0}}>
              Gems
            </span>
          </div> */}
       
        {account.status === "connected" ? (
          <div className="flex items-center gap-2">
            {/* Begin dropdown menu for account actions */}
            <div className="relative">
              {/* The dropdown button */}
              <Button
                className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/80 hover:bg-muted/60 text-sm font-semibold text-muted-foreground border border-border shadow transition"
                tabIndex={0}
                size={"lg"}
                onClick={() => setIsDialogOpen((v) => !v)}
                onBlur={() => setTimeout(() => setIsDialogOpen(false), 180)}
                aria-haspopup="true"
                aria-expanded={isDialogOpen}
              >
                <span className="truncate max-w-[100px] text-xs font-mono">
                  {universalAccount
                    ? `${universalAccount.slice(0, 6)}...${universalAccount.slice(-4)}`
                    : "Universal Account"}
                </span>
                {/* <span className="hidden sm:inline-block mx-2 text-xs text-muted-foreground">
                  (${remainingBudgetUsd === null ? "—" : remainingBudgetUsd.toFixed(2)})
                </span> */}
                <span className="ml-2 text-xs flex items-center gap-1">
                  {universalBalance?.formatted.slice(0, 6)} {universalBalance?.symbol}
                </span>
                <svg className="w-4 h-4 ml-1 opacity-70" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="1.5" d="M6 8l4 4 4-4"/></svg>
              </Button>

              {/* Dropdown content */}
              {isDialogOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50 p-4 text-sm min-w-[230px]">
                  <div className="flex flex-col gap-2">
                    {/* Account Address copy */}
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {universalAccount
                          ? `${universalAccount.slice(0, 10)}...${universalAccount.slice(-8)}`
                          : "—"}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-primary font-medium hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(universalAccount || "");
                          toast.success("Address copied!");
                        }}
                        tabIndex={-1}
                        aria-label="Copy universal account address"
                        title="Copy universal account address"
                      >
                        Copy
                      </button>
                    </div>
                    
                    {/* Username display and edit */}
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Username:</span>
                        <span className="text-sm font-medium">{currentUsername || "Loading..."}</span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        onClick={() => setIsUsernameModalOpen(true)}
                        tabIndex={-1}
                        aria-label="Edit username"
                        title="Edit username"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                    {/* Budget */}
                    {/* <div className="text-xs flex justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span>
                        {remainingBudgetUsd === null
                          ? "—"
                          : `$${remainingBudgetUsd.toFixed(2)}`}
                      </span>
                    </div> */}
                    {/* Universal Balance statistic */}
                    <div className="bg-muted rounded px-3 py-2 flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        Universal USDC Balance
                      </span>
                      <span className="font-medium text-base">
                        {universalBalance
                          ? `${universalBalance.formatted} ${universalBalance.symbol}`
                          : "Loading..."}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleFundAccount}
                        disabled={faucetMutation.isPending || !faucetEligibility.isEligible}
                        className="h-auto p-0 text-xs mt-1"
                        title={
                          !faucetEligibility.isEligible ? faucetEligibility.reason : undefined
                        }
                      >
                        {faucetMutation.isPending
                          ? "Funding..."
                          : faucetEligibility.isEligible
                          ? "Get USDC on Base Sepolia"
                          : "Sufficient Balance"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {/* <Button
                      variant="default"
                      onClick={() => requestBudget(DEFAULT_BUDGET_USD)}
                      size="sm"
                      disabled={isRequesting || account.status !== "connected"}
                      title={"Approve a spending budget for seamless buys"}
                    >
                      {isRequesting ? "Requesting..." : `Top Up Budget ($${DEFAULT_BUDGET_USD})`}
                    </Button> */}
                    <Button variant="outline" onClick={() => disconnect()} size="sm">
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* End dropdown */}
          </div>
        ) : (
          <div className="flex gap-2">
            {connectors.slice(0, 1).map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                size="lg"
              >
                Sign in with Base
              </Button>
            ))}
          </div>
        )}
        </div>
       </div>
       </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[720px_1fr] gap-8 items-start">
          <div className="flex flex-col items-center">
            <Timer elapsedMs={flip.state.elapsedMs} penaltiesMs={flip.state.penaltiesMs} isRunning={flip.state.isRunning} />

            {!flip.state.hasEntryPaid && (
              <div className="w-full max-w-[720px] mb-3">
                <div className="border rounded-md p-3 flex items-center justify-between bg-card/70">
                  <div>
                    <div className="text-sm font-medium">Pay $1.00 to play</div>
                    <div className="text-xs text-muted-foreground">Required before your first flip.</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const units = parseUnits("1.00", USDC.decimals);
                        const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [TREASURY_ADDRESS, units] });
                        sendEntryTransaction({ to: USDC.address, data, value: 0n });
                      } catch {}
                    }}
                    disabled={flip.state.hasEntryPaid || account.status !== "connected" || isEntryPending || isEntryConfirming}
                  >
                    {isEntryPending ? "Paying..." : isEntryConfirming ? "Confirming..." : "Pay & Start"}
                  </Button>
                </div>
              </div>
            )}

            {flip.state.hasEntryPaid && !flip.state.firstFlipHappened && !flip.state.isComplete && (
              <div className="w-full max-w-[720px] mb-3">
                <div className="rounded-md px-3 py-2 text-sm bg-emerald-600/15 text-emerald-300 border border-emerald-700/40">Entry paid. Start flipping to begin the timer.</div>
              </div>
            )}

            <Board
              cards={flip.state.board}
              onFlip={(idx) => {
                // Send mark-start once, when first flip happens
                if (flip.state.hasEntryPaid && !flip.state.firstFlipHappened && playId) {
                  fetch("/api/game/mark-start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playId, startTimeMs: Date.now() }),
                  }).catch(() => {});
                }
                flip.actions.flipCard(idx);
              }}
              disabled={!flip.state.hasEntryPaid}
              loadingOverlayText={isSubmittingScore ? "Submitting score…" : null}
            />
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span>Pairs matched: {flip.state.pairsMatched}/8</span>
              {flip.state.isComplete && <span className="text-green-500 font-medium">Completed!</span>}
              <Button size="sm" variant="outline" onClick={flip.actions.reset}>New Game</Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Budget</div>
              <div className="text-xl font-semibold">${remainingBudgetUsd === null ? "—" : remainingBudgetUsd.toFixed(2)}</div>
              <Button className="mt-3" size="sm" onClick={() => requestBudget(DEFAULT_BUDGET_USD)} disabled={isRequesting || account.status !== "connected"}>
                {isRequesting ? "Requesting..." : `Top Up Balance ($${DEFAULT_BUDGET_USD})`}
              </Button>
            </div> */}

            {/* <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Entry Fee</div>
                  <div className="text-lg font-semibold">$1.00 to play</div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const units = parseUnits("1.00", USDC.decimals);
                      const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [TREASURY_ADDRESS, units] });
                      sendEntryTransaction({ to: USDC.address, data, value: 0n });
                    } catch {}
                  }}
                  disabled={flip.state.hasEntryPaid || account.status !== "connected" || isEntryPending || isEntryConfirming}
                  variant={flip.state.hasEntryPaid ? "secondary" : "default"}
                  title={flip.state.hasEntryPaid ? "Already paid" : undefined}
                >
                  {flip.state.hasEntryPaid ? "Paid" : isEntryPending ? "Paying..." : isEntryConfirming ? "Confirming..." : "Pay & Start"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Required before first flip. Uses your Spend Permission.</div>
            </div> */}

            <RightTabs
              isConnected={account.status === "connected"}
              onConnect={() => { const first = connectors[0]; if (first) connect({ connector: first }); }}
              onPeek={flip.actions.usePeek}
              onAutoMatch={flip.actions.useAutoMatch}
              isInGame={flip.state.isRunning && !flip.state.isComplete}
              inventory={flip.state.inventory}
              onUseInventory={(t) => flip.actions.useFromInventory(t)}
              onAddToInventory={(t) => flip.actions.addToInventory(t)}
              // pass playId so store logs in-game purchases
              // @ts-ignore
              playId={playId}
              userId={account.address ?? null}
              currentUsername={currentUsername}
            />
            </div>
        </div>
        </div>
      </div>
      
      {/* Username Modal */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        currentUsername={currentUsername}
        userId={account.address || ""}
        onUsernameUpdate={(newUsername) => {
          setCurrentUsername(newUsername);
          setIsUsernameModalOpen(false);
        }}
      />
    </main>
  );
}

export default App;

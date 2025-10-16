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
import Posts from "../components/posts";
import ClickerPanel from "@/components/ClickerPanel";
import GameTabs from "@/components/GameTabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect, useMemo } from "react";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { USDC, erc20Abi } from "@/lib/usdc";
import { useFaucet } from "@/hooks/useFaucet";
import { useFaucetEligibility } from "@/hooks/useFaucetEligibility";
import { useSpendPermission } from "@/hooks/useSpendPermission";
import { DEFAULT_BUDGET_USD } from "@/lib/constants";
import { useGameState } from "@/hooks/useGameState";
import StorePanel from "@/components/StorePanel";
import { Coins } from "lucide-react";

// Inline SVG icon to match the "gems" icon in the screenshot
function GemIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24" height="24" viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="10" stroke="#8464e9" strokeWidth="2.2" fill="#151D22"/>
      <circle cx="12" cy="12" r="6" stroke="#8b5cf6" strokeWidth="2"/>
    </svg>
  );
}

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
  const { state: game, actions, costs } = useGameState();

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
            <h1 className="text-2xl font-bold text-balance">Crypto Clicker</h1>
        </div>
        {/* Gems indicator as in screenshot */} 
        <div className="flex items-center gap-3">
          <div className="bg-[#17212b] rounded-md px-4 py-2 flex items-center gap-2 shadow-sm" style={{
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
          </div>
       
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
                <span className="hidden sm:inline-block mx-2 text-xs text-muted-foreground">
                  (${remainingBudgetUsd === null ? "—" : remainingBudgetUsd.toFixed(2)})
                </span>
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
                    {/* Budget */}
                    <div className="text-xs flex justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span>
                        {remainingBudgetUsd === null
                          ? "—"
                          : `$${remainingBudgetUsd.toFixed(2)}`}
                      </span>
                    </div>
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
                    <Button
                      variant="default"
                      onClick={() => requestBudget(DEFAULT_BUDGET_USD)}
                      size="sm"
                      disabled={isRequesting || account.status !== "connected"}
                      title={"Approve a spending budget for seamless buys"}
                    >
                      {isRequesting ? "Requesting..." : `Top Up Budget ($${DEFAULT_BUDGET_USD})`}
                    </Button>
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
                {connector.name}
              </Button>
            ))}
          </div>
        )}
        </div>
       </div>
       </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
            <ClickerPanel gems={game.gems} gemsPerClick={game.gemsPerClick} onClick={actions.click} />
            <GameTabs
              gems={game.gems}
              gemsPerSecond={game.gemsPerSecond}
              strongerClicksLevel={game.strongerClicksLevel}
              autoMinerLevel={game.autoMinerLevel}
              strongerClicksCost={costs.strongerClicksCost}
              autoMinerCost={costs.autoMinerCost}
              onBuyStrongerClicks={actions.buyStrongerClicks}
              onBuyAutoMiner={actions.buyAutoMiner}
              isConnected={account.status === "connected"}
              onConnect={() => {
                const first = connectors[0];
                if (first) connect({ connector: first });
              }}
              onActivateClickFrenzy={(d, m) => actions.activateClickFrenzy(d, m)}
              onGrantGems={(n) => actions.grantGems(n)}
            />
            </div>
          <div className="hidden lg:block" />
        </div>
      </div>
    </main>
  );
}

export default App;

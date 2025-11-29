"use client";

import { useCallback, useMemo, useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { USDC, erc20Abi } from "@/lib/usdc";
import { TREASURY_ADDRESS } from "@/lib/constants";
import { STORE_ITEMS } from "@/lib/store";
import { toast } from "sonner";

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

export function useStorePurchases() {
  const account = useAccount();
  const { sendTransaction, data: hash, isPending, reset } = useSendTransaction();
  const [activePurchase, setActivePurchase] = useState<string | null>(null);
  const [manualTxHash, setManualTxHash] = useState<`0x${string}` | null>(null);
  const [manualPending, setManualPending] = useState(false);

  const buyItem = useCallback(
    async (itemId: keyof typeof STORE_ITEMS): Promise<PurchaseResult> => {
      const item = STORE_ITEMS[itemId];
      if (!item) return { success: false, error: "Unknown item" };

      try {
        setActivePurchase(itemId);
        const units = parseUnits(item.priceUsd.toFixed(2), USDC.decimals);
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [TREASURY_ADDRESS, units],
        });

        const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
        if (isMiniPay && account.address) {
          setManualPending(true);
          const txHash = await (window as any).ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: account.address,
                to: USDC.address,
                data,
                value: "0x0",
                feeCurrency: USDC.address,
              },
            ],
          });
          setManualTxHash(txHash as `0x${string}`);
          setManualPending(false);
        } else {
          // Spend Permission flow will trigger automatically on first purchase if needed
          sendTransaction({ to: USDC.address, data, value: 0n });
        }

        toast("Processing purchase...", { description: `${item.name} - $${item.priceUsd.toFixed(2)}`, duration: 1500 });
        return { success: true };
      } catch (e) {
        setManualPending(false);
        setManualTxHash(null);
        setActivePurchase(null);
        const msg = e instanceof Error ? e.message : "Failed";
        toast.error("Purchase failed", { description: msg });
        return { success: false, error: msg };
      }
    },
    [sendTransaction, account.address]
  );

  const resetAll = useCallback(() => {
    reset();
    setActivePurchase(null);
    setManualTxHash(null);
    setManualPending(false);
  }, [reset]);

  const state = useMemo(
    () => ({
      isPending: isPending || manualPending,
      txHash: manualTxHash ?? hash,
      activePurchase,
      reset: resetAll,
    }),
    [isPending, manualPending, manualTxHash, hash, activePurchase, resetAll]
  );

  return { buyItem, state };
}



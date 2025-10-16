"use client";

import { useCallback, useMemo, useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { useSendTransaction } from "wagmi";
import { USDC, erc20Abi } from "@/lib/usdc";
import { TREASURY_ADDRESS } from "@/lib/constants";
import { STORE_ITEMS } from "@/lib/store";
import { toast } from "sonner";

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

export function useStorePurchases() {
  const { sendTransaction, data: hash, isPending, reset } = useSendTransaction();
  const [activePurchase, setActivePurchase] = useState<string | null>(null);

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
        // Spend Permission flow will trigger automatically on first purchase if needed
        sendTransaction({ to: USDC.address, data, value: 0n });
        toast("Processing purchase...", { description: `${item.name} - $${item.priceUsd.toFixed(2)}`, duration: 1500 });
        return { success: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        toast.error("Purchase failed", { description: msg });
        return { success: false, error: msg };
      }
    },
    [sendTransaction]
  );

  const state = useMemo(
    () => ({ isPending, txHash: hash, activePurchase, reset }),
    [isPending, hash, activePurchase, reset]
  );

  return { buyItem, state };
}



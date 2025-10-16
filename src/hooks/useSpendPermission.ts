"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount, useBalance, useConnections, useSendTransaction } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import { USDC, erc20Abi } from "@/lib/usdc";
import { TREASURY_ADDRESS } from "@/lib/constants";

export interface SpendPermissionState {
  remainingBudgetUsd: number | null; // best-effort display; not authoritative yet
  isRequesting: boolean;
  requestBudget: (amountUsd: number) => Promise<void>;
}

/**
 * Minimal helper to surface Base Account's Auto Spend Permission prompt by
 * initiating a small USDC transfer from the Sub Account. The SDK will prompt
 * the user to approve spend permissions if needed. After approval, subsequent
 * purchases proceed without additional prompts (until budget is exhausted).
 */
export function useSpendPermission(): SpendPermissionState {
  const account = useAccount();
  const connections = useConnections();
  const connection = connections[0];
  const subAddress = account.address;
  const mainAddress = connection?.accounts?.[0];

  // Use universal balance as a coarse proxy for available funds display.
  const { data: universalUsdcBalance } = useBalance({
    address: mainAddress as `0x${string}` | undefined,
    token: USDC.address,
    query: { enabled: Boolean(mainAddress) },
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const { sendTransaction } = useSendTransaction();

  const requestBudget = useCallback(
    async (amountUsd: number) => {
      if (!subAddress) throw new Error("Not connected");

      // Use $1 test transfer to trigger the Spend Permission prompt even if
      // the user wants a larger budget. The SDK aggregates permissions.
      const amount = Math.max(0.01, Math.min(amountUsd, 1));
      const units = parseUnits(amount.toFixed(2), USDC.decimals);

      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, units],
      });

      try {
        setIsRequesting(true);
        // Will prompt Spend Permission if the sub account lacks funds/permits.
        sendTransaction({ to: USDC.address, data, value: 0n });
      } finally {
        setIsRequesting(false);
      }
    },
    [sendTransaction, subAddress]
  );

  const remainingBudgetUsd = useMemo(() => {
    // Best-effort display: show universal USDC balance as a coarse budget proxy.
    // Later we can compute an exact remaining permission if desired.
    if (!universalUsdcBalance) return null;
    return Number(universalUsdcBalance.formatted);
  }, [universalUsdcBalance]);

  return { remainingBudgetUsd, isRequesting, requestBudget };
}



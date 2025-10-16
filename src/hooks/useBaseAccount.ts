import { useMemo } from "react";
import { useAccount, useConnections } from "wagmi";

export interface BaseAccountInfo {
  subAddress: `0x${string}` | undefined;
  mainAddress: `0x${string}` | undefined;
  isConnected: boolean;
  connector: ReturnType<typeof useConnections>[number]["connector"] | undefined;
}

/**
 * Provides Base Account connection info consistent with the existing app setup:
 * - Sub Account is the default `useAccount().address` (since defaultAccount: "sub")
 * - Main/Universal Account comes from the first connection's first account
 */
export function useBaseAccount(): BaseAccountInfo {
  const account = useAccount();
  const connections = useConnections();

  const { subAddress, mainAddress, connector } = useMemo(() => {
    const sub = account.address as `0x${string}` | undefined;
    const connection = connections[0];
    const universal = (connection?.accounts?.[0] ?? undefined) as
      | `0x${string}`
      | undefined;
    return {
      subAddress: sub,
      mainAddress: universal,
      connector: connection?.connector,
    };
  }, [account.address, connections]);

  return {
    subAddress,
    mainAddress,
    isConnected: account.status === "connected",
    connector,
  };
}



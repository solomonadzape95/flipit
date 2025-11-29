import { createPublicClient, http, formatUnits, type Chain } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { USDC, erc20Abi } from "./usdc";

// Celo Sepolia testnet chain definition
// Chain ID: 11142220 (from https://docs.celo.org/tooling/overview/network-overview)
const celoSepolia: Chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC ?? "https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
} as const;

// Minimum balance threshold - if user has more than this, they can't use the faucet
export const FAUCET_BALANCE_THRESHOLD = 0.1;

/**
 * Check if an address is eligible for faucet funds
 * Returns true if balance is <= threshold
 */
export async function isEligibleForFaucet(
  address: string
): Promise<{ eligible: boolean; balance: string; reason?: string }> {
  try {
    const network = process.env.NEXT_PUBLIC_CELO_NETWORK;
    const chain = network === "mainnet" 
      ? celo 
      : network === "alfajores"
      ? celoAlfajores
      : celoSepolia;
    const publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });

    const balance = await publicClient.readContract({
      address: USDC.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    const balanceFormatted = formatUnits(balance, USDC.decimals);
    const balanceNumber = parseFloat(balanceFormatted);

    if (balanceNumber > FAUCET_BALANCE_THRESHOLD) {
      return {
        eligible: false,
        balance: balanceFormatted,
        reason: `Balance (${balanceFormatted} cUSD) exceeds threshold of ${FAUCET_BALANCE_THRESHOLD} cUSD`,
      };
    }

    return {
      eligible: true,
      balance: balanceFormatted,
    };
  } catch (error) {
    console.error("Error checking faucet eligibility:", error);
    throw new Error("Failed to check faucet eligibility");
  }
}

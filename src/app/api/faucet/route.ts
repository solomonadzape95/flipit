import { NextResponse } from "next/server";
import { isEligibleForFaucet } from "@/lib/faucet";
import { createWalletClient, http, parseUnits, encodeFunctionData, type Chain } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { USDC, erc20Abi } from "@/lib/usdc";

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

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Check if address is eligible for faucet funds
    const eligibility = await isEligibleForFaucet(address);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: "Not eligible for faucet",
          details: eligibility.reason,
          balance: eligibility.balance,
        },
        { status: 403 }
      );
    }

    // Validate that required environment variables are set
    const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!faucetPrivateKey) {
      console.error("Missing FAUCET_PRIVATE_KEY in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Faucet private key not configured" },
        { status: 500 }
      );
    }

    const network = process.env.NEXT_PUBLIC_CELO_NETWORK;
    const chain = network === "mainnet" 
      ? celo 
      : network === "alfajores"
      ? celoAlfajores
      : celoSepolia;
    const explorerBaseUrl = network === "mainnet" 
      ? "https://celoscan.io" 
      : network === "alfajores"
      ? "https://alfajores.celoscan.io"
      : "https://sepolia.celoscan.io";

    // Create wallet client for faucet
    const walletClient = createWalletClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
      account: faucetPrivateKey as `0x${string}`,
    });

    // Send cUSD to the user (e.g., 10 cUSD for testing)
    const amount = parseUnits("10", USDC.decimals);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [address as `0x${string}`, amount],
    });

    const hash = await walletClient.sendTransaction({
      to: USDC.address,
      data,
      value: 0n,
    });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      explorerUrl: `${explorerBaseUrl}/tx/${hash}`,
      message: "cUSD sent successfully to your wallet",
    });
  } catch (error) {
    console.error("Faucet error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to fund account",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWalletClient, http, formatUnits, parseUnits, type Chain } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { USDC, erc20Abi } from "@/lib/usdc";
import { PAYOUT_POOL_PERCENT, PAYOUT_SPLITS, TREASURY_ADDRESS, ENTRY_FEE_CUSD } from "@/lib/constants";

// Celo Sepolia testnet chain definition
const celoSepolia: Chain = {
  id: 111557560,
  name: "Celo Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC ?? "https://rpc.ankr.com/celo_sepolia"],
    },
  },
  blockExplorers: {
    default: {
      name: "CeloScan Sepolia",
      url: "https://sepolia.celoscan.io",
    },
  },
  testnet: true,
} as const;

// Handle both GET (from Vercel cron) and POST (manual calls)
export async function GET() {
  return POST();
}

export async function POST() {
  try {
    // Compute UTC day range
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    // Sum entry fees count from plays started today
    const playsToday = await prisma.play.count({ where: { startTime: { gte: start, lte: end } } });
    const totalPoolUsd = playsToday * ENTRY_FEE_CUSD; // 0.01 cUSD per game
    const distributableUsd = totalPoolUsd * PAYOUT_POOL_PERCENT;

    // Top 3 fastest scores today
    const top3 = await prisma.score.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { finalTimeMs: "asc" },
      take: 3,
    });

    if (top3.length === 0 || distributableUsd <= 0) {
      return NextResponse.json({ ok: true, message: "Nothing to distribute" });
    }

    const pk = process.env.TREASURY_PRIVATE_KEY as `0x${string}` | undefined;
    if (!pk) return NextResponse.json({ error: "Missing TREASURY_PRIVATE_KEY" }, { status: 500 });

    const network = process.env.NEXT_PUBLIC_CELO_NETWORK;
    const chain = network === "mainnet" 
      ? celo 
      : network === "alfajores"
      ? celoAlfajores
      : celoSepolia;
    const client = createWalletClient({ chain, transport: http(chain.rpcUrls.default.http[0]) }).extend((c) => ({
      account: { type: 'local', privateKey: pk } as any,
    })) as any;

    // Distribute cUSD according to splits
    const txs: string[] = [];
    for (let i = 0; i < top3.length; i++) {
      const shareUsd = distributableUsd * PAYOUT_SPLITS[i];
      if (shareUsd <= 0) continue;
      // Use 18 decimals for cUSD
      const units = parseUnits(shareUsd.toFixed(18), USDC.decimals);
      const hash = await client.sendTransaction({
        to: USDC.address,
        data: {
          abi: erc20Abi,
          functionName: "transfer",
          args: [top3[i].userId as `0x${string}`, units],
        } as any,
      });
      txs.push(hash);
    }

    return NextResponse.json({ ok: true, playsToday, distributableUsd, txs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}



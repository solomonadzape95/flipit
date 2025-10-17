import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const top = await prisma.score.findMany({ 
    orderBy: { finalTimeMs: "asc" }, 
    take: 20, // Top 20 players
    include: { user: true }
  });
  const scores = top.map((s: any, i: any) => ({ 
    rank: i + 1, 
    username: s.username || s.user.username || shorten(s.userId), 
    finalTimeMs: s.finalTimeMs 
  }));
  return NextResponse.json({ scores });
}

function shorten(addr: string) {
  if (!addr?.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}



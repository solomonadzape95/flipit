import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const top = await prisma.score.findMany({ orderBy: { finalTimeMs: "asc" }, take: 50 });
    const scores = top.map((s, i) => ({ rank: i + 1, username: shorten(s.username ?? s.userId), finalTimeMs: s.finalTimeMs }));
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ scores: [] }, { status: 500 });
  }
}

function shorten(addr: string) {
  if (!addr?.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}



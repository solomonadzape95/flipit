import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const top = await prisma.score.findMany({ orderBy: { finalTimeMs: "asc" }, take: 50 });
  const scores = top.map((s :any , i : any) => ({ rank: i + 1, username: shorten(s.username ?? s.userId), finalTimeMs: s.finalTimeMs }));
  return NextResponse.json({ scores });
}

function shorten(addr: string) {
  if (!addr?.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}



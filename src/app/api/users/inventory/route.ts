import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { userId, peekDelta, autoMatchDelta } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });

  const data: any = {};
  if (typeof peekDelta === "number" && peekDelta !== 0) data.peekCount = { increment: peekDelta };
  if (typeof autoMatchDelta === "number" && autoMatchDelta !== 0) data.autoMatchCount = { increment: autoMatchDelta };
  if (!data.peekCount && !data.autoMatchCount) return NextResponse.json({ error: "no changes" }, { status: 400 });

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: data,
    create: { id: userId, peekCount: Math.max(0, peekDelta || 0), autoMatchCount: Math.max(0, autoMatchDelta || 0) },
  });
  return NextResponse.json({ user });
}



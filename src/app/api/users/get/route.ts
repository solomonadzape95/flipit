import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  console.log("Getting user:", { userId, user });
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, peekCount: user.peekCount, autoMatchCount: user.autoMatchCount, username: user.username } });
}



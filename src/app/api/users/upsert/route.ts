import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { userId, username } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: username ? { username } : {},
    create: { id: userId, username },
  });
  return NextResponse.json({ user });
}



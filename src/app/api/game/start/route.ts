import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });
  await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId } });
  const play = await prisma.play.create({ data: { userId } });
  return NextResponse.json({ playId: play.id });
}




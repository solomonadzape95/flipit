import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { playId, powerupType, source } = await request.json().catch(() => ({}));
  if (typeof playId !== "string" || (powerupType !== "peek" && powerupType !== "autoMatch")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const play = await prisma.play.findUnique({ where: { id: playId } });
  if (!play) return NextResponse.json({ error: "Play not found" }, { status: 404 });
  // If source is "inventory", also count toward inventoryUsed fields
  const data = powerupType === "peek"
    ? { powerupsPeek: { increment: 1 }, ...(source === "inventory" ? { inventoryPeekUsed: { increment: 1 } } : {}) }
    : { powerupsAuto: { increment: 1 }, ...(source === "inventory" ? { inventoryAutoUsed: { increment: 1 } } : {}) };
  await prisma.play.update({ where: { id: playId }, data });
  return NextResponse.json({ ok: true });
}



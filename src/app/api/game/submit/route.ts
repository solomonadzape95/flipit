import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { playId, endTimeMs, username, clientFinalTimeMs } = await request.json().catch(() => ({}));
  if (typeof playId !== "string" || (typeof endTimeMs !== "number" && typeof clientFinalTimeMs !== "number")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const play = await prisma.play.findUnique({ where: { id: playId }, include: { user: true } });
  if (!play) return NextResponse.json({ error: "Play not found" }, { status: 404 });

  let finalTimeMs: number;
  let penalties = play.powerupsPeek * 5000 + play.powerupsAuto * 5000;
  if (typeof clientFinalTimeMs === "number") {
    // Trust client-reported final time to match on-screen timer
    finalTimeMs = Math.max(0, Math.floor(clientFinalTimeMs));
  } else {
    const baseElapsed = Math.max(0, endTimeMs - play.startTime.getTime());
    finalTimeMs = baseElapsed + penalties;
  }

  const updated = await prisma.play.update({ where: { id: playId }, data: { endTime: new Date(endTimeMs), finalTimeMs, penaltiesMs: penalties } });

  // Subtract consumed inventory from user's counts
  if (updated.inventoryPeekUsed || updated.inventoryAutoUsed) {
    await prisma.user.update({
      where: { id: play.userId },
      data: {
        peekCount: { decrement: Math.max(0, updated.inventoryPeekUsed) },
        autoMatchCount: { decrement: Math.max(0, updated.inventoryAutoUsed) },
      },
    }).catch(() => {});
  }

  // Upsert username and store score row
  if (typeof username === "string" && username.length > 0) {
    await prisma.user.update({ where: { id: play.userId }, data: { username } });
  }
  await prisma.score.create({ data: { userId: play.userId, username: (username ?? play.user.username) ?? undefined, finalTimeMs } });

  return NextResponse.json({ finalTimeMs, penaltiesMs: penalties });
}



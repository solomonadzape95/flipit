import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { playId, startTimeMs } = await request.json().catch(() => ({}));
  if (typeof playId !== "string" || typeof startTimeMs !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const play = await prisma.play.findUnique({ where: { id: playId } });
  if (!play) return NextResponse.json({ error: "Play not found" }, { status: 404 });
  const newStart = new Date(startTimeMs);
  // If startTime is after provided time, move it earlier to align with client timer
  if (!play.startTime || play.startTime.getTime() > startTimeMs) {
    await prisma.play.update({ where: { id: playId }, data: { startTime: newStart } });
  }
  return NextResponse.json({ ok: true });
}



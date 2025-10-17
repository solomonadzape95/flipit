import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });
  
  // Ensure user exists with proper username
  const defaultUsername = `Player_${userId.slice(2, 8)}`;
  await prisma.user.upsert({ 
    where: { id: userId }, 
    update: {}, 
    create: { 
      id: userId, 
      username: defaultUsername,
      peekCount: 0,
      autoMatchCount: 0
    } 
  });
  
  const play = await prisma.play.create({ data: { userId } });
  return NextResponse.json({ playId: play.id });
}




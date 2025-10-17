import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId, username } = await request.json().catch(() => ({}));
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 });
  
  // Generate a default username from wallet address if none provided
  const defaultUsername = username || `Player_${userId.slice(2, 8)}`;
  
  console.log("Upserting user:", { userId, username, defaultUsername });
  
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: username ? { username } : {},
    create: { 
      id: userId, 
      username: defaultUsername,
      peekCount: 0,
      autoMatchCount: 0
    },
  });
  
  // If username was updated, also update all scores for this user
  if (username && user.username !== username) {
    await prisma.score.updateMany({
      where: { userId: user.id },
      data: { username: username }
    });
    console.log(`Updated scores for user ${user.id} with new username: ${username}`);
  }
  
  console.log("Upserted user:", user);
  return NextResponse.json({ user });
}



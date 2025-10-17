import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json();
    
    if (!userId || !username) {
      return NextResponse.json({ error: "userId and username are required" }, { status: 400 });
    }

    if (username.length > 20) {
      return NextResponse.json({ error: "Username must be 20 characters or less" }, { status: 400 });
    }

    if (username.length < 1) {
      return NextResponse.json({ error: "Username cannot be empty" }, { status: 400 });
    }

    console.log(`Updating username for user ${userId} to: ${username}`);

    // Update the user's username
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    // Update all scores for this user with the new username
    const updatedScores = await prisma.score.updateMany({
      where: { userId },
      data: { username },
    });

    console.log(`Updated ${updatedScores.count} scores for user ${userId}`);

    return NextResponse.json({ 
      user: updatedUser,
      updatedScoresCount: updatedScores.count 
    });

  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 });
  }
}

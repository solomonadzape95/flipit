-- Complete schema recreation script for Supabase
-- Run this in the Supabase SQL Editor after reactivating your project

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "Score" CASCADE;
DROP TABLE IF EXISTS "Play" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_scores_username ON "User";
DROP FUNCTION IF EXISTS update_scores_username() CASCADE;

-- Create User table
CREATE TABLE "User" (
    "id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255),
    "peekCount" INTEGER NOT NULL DEFAULT 0,
    "autoMatchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Play table
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "finalTimeMs" INTEGER,
    "penaltiesMs" INTEGER NOT NULL DEFAULT 0,
    "powerupsPeek" INTEGER NOT NULL DEFAULT 0,
    "powerupsAuto" INTEGER NOT NULL DEFAULT 0,
    "inventoryPeekUsed" INTEGER NOT NULL DEFAULT 0,
    "inventoryAutoUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- Create Score table
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" VARCHAR(255),
    "finalTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- Create indexes on Score table
CREATE INDEX "Score_createdAt_idx" ON "Score"("createdAt");
CREATE INDEX "Score_finalTimeMs_idx" ON "Score"("finalTimeMs");

-- Add foreign key constraints
ALTER TABLE "Play" ADD CONSTRAINT "Play_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create function to update usernames in scores table when user username changes
CREATE OR REPLACE FUNCTION update_scores_username()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all scores for this user with the new username
    UPDATE "Score" 
    SET username = NEW.username 
    WHERE "userId" = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when user username is updated
CREATE TRIGGER trigger_update_scores_username
    AFTER UPDATE OF username ON "User"
    FOR EACH ROW
    WHEN (OLD.username IS DISTINCT FROM NEW.username)
    EXECUTE FUNCTION update_scores_username();


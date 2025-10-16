-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "finalTimeMs" INTEGER,
    "penaltiesMs" INTEGER NOT NULL DEFAULT 0,
    "powerupsPeek" INTEGER NOT NULL DEFAULT 0,
    "powerupsAuto" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" VARCHAR(255),
    "finalTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Score_createdAt_idx" ON "Score"("createdAt");

-- CreateIndex
CREATE INDEX "Score_finalTimeMs_idx" ON "Score"("finalTimeMs");

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

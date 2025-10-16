-- AlterTable
ALTER TABLE "Play" ADD COLUMN     "inventoryAutoUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inventoryPeekUsed" INTEGER NOT NULL DEFAULT 0;

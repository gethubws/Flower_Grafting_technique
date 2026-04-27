/*
  Warnings:

  - Added the required column `updatedAt` to the `Flower` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Flower" ADD COLUMN     "consumedAt" TIMESTAMP(3),
ADD COLUMN     "isShopSeed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "stage" SET DEFAULT 'SEED';

-- AlterTable
ALTER TABLE "FusionLog" ADD COLUMN     "failType" TEXT,
ADD COLUMN     "isFirstTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resultFlowerId" TEXT,
ADD COLUMN     "rewardGold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardXp" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "resultRarity" DROP NOT NULL,
ALTER COLUMN "resultAtoms" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "GardenSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "flowerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "emoji" TEXT NOT NULL DEFAULT '🌱',
    "priceGold" INTEGER NOT NULL,
    "atomLibrary" JSONB NOT NULL,
    "growTime" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GOLD',
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GardenSlot_flowerId_key" ON "GardenSlot"("flowerId");

-- CreateIndex
CREATE INDEX "GardenSlot_userId_idx" ON "GardenSlot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenSlot_userId_position_key" ON "GardenSlot"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Seed_name_key" ON "Seed"("name");

-- CreateIndex
CREATE INDEX "TransactionLog_userId_idx" ON "TransactionLog"("userId");

-- CreateIndex
CREATE INDEX "TransactionLog_userId_type_idx" ON "TransactionLog"("userId", "type");

-- CreateIndex
CREATE INDEX "Flower_ownerId_idx" ON "Flower"("ownerId");

-- CreateIndex
CREATE INDEX "Flower_ownerId_stage_idx" ON "Flower"("ownerId", "stage");

-- CreateIndex
CREATE INDEX "FusionLog_userId_idx" ON "FusionLog"("userId");

-- CreateIndex
CREATE INDEX "FusionLog_userId_parentAId_parentBId_resultRarity_idx" ON "FusionLog"("userId", "parentAId", "parentBId", "resultRarity");

-- AddForeignKey
ALTER TABLE "GardenSlot" ADD CONSTRAINT "GardenSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenSlot" ADD CONSTRAINT "GardenSlot_flowerId_fkey" FOREIGN KEY ("flowerId") REFERENCES "Flower"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

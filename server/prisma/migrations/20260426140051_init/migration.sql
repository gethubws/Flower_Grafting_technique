-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "gold" INTEGER NOT NULL DEFAULT 500,
    "diamond" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flower" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT,
    "parentAId" TEXT,
    "parentBId" TEXT,
    "rarity" TEXT NOT NULL,
    "atoms" JSONB NOT NULL,
    "stage" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isStable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentAId" TEXT,
    "parentBId" TEXT,
    "soil" TEXT,
    "ritual" TEXT,
    "resultRarity" TEXT NOT NULL,
    "resultAtoms" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FusionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Flower" ADD CONSTRAINT "Flower_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionLog" ADD CONSTRAINT "FusionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionLog" ADD CONSTRAINT "FusionLog_parentAId_fkey" FOREIGN KEY ("parentAId") REFERENCES "Flower"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionLog" ADD CONSTRAINT "FusionLog_parentBId_fkey" FOREIGN KEY ("parentBId") REFERENCES "Flower"("id") ON DELETE SET NULL ON UPDATE CASCADE;

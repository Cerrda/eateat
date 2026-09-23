-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KitchenStatus" AS ENUM ('PENDING', 'BOUND', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COOKER', 'EATER');

-- CreateEnum
CREATE TYPE "DishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "CoverStatus" AS ENUM ('READY', 'FAILED');

-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kitchen" (
    "id" TEXT NOT NULL,
    "status" "KitchenStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kitchen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "displayName" TEXT NOT NULL,
    "ordersSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "activeMemberKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "ingredients" TEXT NOT NULL DEFAULT '',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "durationMinutes" INTEGER,
    "servings" TEXT NOT NULL DEFAULT '',
    "coverPath" TEXT,
    "sourceUrl" TEXT,
    "status" "DishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverAttempt" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "imagePath" TEXT,
    "status" "CoverStatus" NOT NULL,
    "adopted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealOrder" (
    "id" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "mealDate" TEXT NOT NULL,
    "slot" "MealSlot" NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" "OrderStatus" NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "actorRole" "Role",
    "activeSlotKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MealOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dishId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "coverSnapshot" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealRecord" (
    "id" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "orderId" TEXT,
    "mealDate" TEXT NOT NULL,
    "slot" "MealSlot" NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MealRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordPhoto" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RecordPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordDish" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "dishId" TEXT,
    "nameSnapshot" TEXT NOT NULL,

    CONSTRAINT "RecordDish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_clientKey_key" ON "Member"("clientKey");

-- CreateIndex
CREATE INDEX "Member_createdAt_idx" ON "Member"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_memberId_idx" ON "Session"("memberId");

-- CreateIndex
CREATE INDEX "Kitchen_status_idx" ON "Kitchen"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_activeMemberKey_key" ON "Membership"("activeMemberKey");

-- CreateIndex
CREATE INDEX "Membership_kitchenId_leftAt_idx" ON "Membership"("kitchenId", "leftAt");

-- CreateIndex
CREATE INDEX "Membership_memberId_leftAt_idx" ON "Membership"("memberId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_kitchenId_revokedAt_idx" ON "Invite"("kitchenId", "revokedAt");

-- CreateIndex
CREATE INDEX "Dish_kitchenId_status_deletedAt_idx" ON "Dish"("kitchenId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Dish_kitchenId_publishedAt_idx" ON "Dish"("kitchenId", "publishedAt");

-- CreateIndex
CREATE INDEX "CoverAttempt_dishId_createdAt_idx" ON "CoverAttempt"("dishId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MealOrder_activeSlotKey_key" ON "MealOrder"("activeSlotKey");

-- CreateIndex
CREATE INDEX "MealOrder_kitchenId_mealDate_slot_idx" ON "MealOrder"("kitchenId", "mealDate", "slot");

-- CreateIndex
CREATE INDEX "MealOrder_kitchenId_status_updatedAt_idx" ON "MealOrder"("kitchenId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_dishId_idx" ON "OrderItem"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "MealRecord_orderId_key" ON "MealRecord"("orderId");

-- CreateIndex
CREATE INDEX "MealRecord_kitchenId_mealDate_deletedAt_idx" ON "MealRecord"("kitchenId", "mealDate", "deletedAt");

-- CreateIndex
CREATE INDEX "RecordPhoto_recordId_idx" ON "RecordPhoto"("recordId");

-- CreateIndex
CREATE INDEX "RecordDish_recordId_idx" ON "RecordDish"("recordId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverAttempt" ADD CONSTRAINT "CoverAttempt_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealOrder" ADD CONSTRAINT "MealOrder_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MealOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRecord" ADD CONSTRAINT "MealRecord_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRecord" ADD CONSTRAINT "MealRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MealOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordPhoto" ADD CONSTRAINT "RecordPhoto_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MealRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordDish" ADD CONSTRAINT "RecordDish_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MealRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordDish" ADD CONSTRAINT "RecordDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE SET NULL ON UPDATE CASCADE;


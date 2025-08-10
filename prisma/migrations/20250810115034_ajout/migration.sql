/*
  Warnings:

  - The values [PROCESSING] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[providerId,accountId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Made the column `message` on table `gdpr_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `verification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `verification` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."VerificationType" AS ENUM ('EMAIL', 'PHONE', 'PASSWORD_RESET', 'TWO_FACTOR');

-- CreateEnum
CREATE TYPE "public"."BadgeCategory" AS ENUM ('GENERAL', 'ACHIEVEMENT', 'PARTICIPATION', 'SPECIAL', 'ANNIVERSARY');

-- CreateEnum
CREATE TYPE "public"."BadgeRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."ConsentSource" AS ENUM ('BANNER', 'SETTINGS', 'REGISTRATION', 'API', 'MIGRATION');

-- CreateEnum
CREATE TYPE "public"."RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."RequestSource" AS ENUM ('WEB_FORM', 'EMAIL', 'PHONE', 'CHAT', 'API', 'ADMIN_PANEL');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."GDPRType" ADD VALUE 'DATA_RESTRICT';
ALTER TYPE "public"."GDPRType" ADD VALUE 'DATA_PORTABLE';
ALTER TYPE "public"."GDPRType" ADD VALUE 'OBJECTION';
ALTER TYPE "public"."GDPRType" ADD VALUE 'CONSENT_WITHDRAW';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."RequestStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "public"."gdpr_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."gdpr_requests" ALTER COLUMN "status" TYPE "public"."RequestStatus_new" USING ("status"::text::"public"."RequestStatus_new");
ALTER TYPE "public"."RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "public"."RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "public"."gdpr_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'DPO';
ALTER TYPE "public"."Role" ADD VALUE 'EDITOR';

-- DropForeignKey
ALTER TABLE "public"."gdpr_requests" DROP CONSTRAINT "gdpr_requests_userId_fkey";

-- AlterTable
ALTER TABLE "public"."account" ADD COLUMN     "firstLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."badge" ADD COLUMN     "category" "public"."BadgeCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "color" TEXT DEFAULT '#3B82F6',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rarity" "public"."BadgeRarity" NOT NULL DEFAULT 'COMMON';

-- AlterTable
ALTER TABLE "public"."gdpr_requests" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "priority" "public"."RequestPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "processedBy" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "public"."RequestSource" NOT NULL DEFAULT 'WEB_FORM',
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "message" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."profile" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT DEFAULT 'fr',
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" "public"."Theme" DEFAULT 'SYSTEM',
ADD COLUMN     "timezone" TEXT DEFAULT 'Europe/Paris';

-- AlterTable
ALTER TABLE "public"."session" ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "bannedBy" TEXT,
ADD COLUMN     "dataRetention" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "emailVerified" SET DEFAULT false,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "banned" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."user_badge" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "public"."user_consents" ADD COLUMN     "communication" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentVersion" TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN     "personalization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "public"."ConsentSource" NOT NULL DEFAULT 'BANNER',
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "withdrawReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."verification" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "public"."VerificationType" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(160),
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'DRAFT',
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6B7280',
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT DEFAULT '#8B5CF6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_tags" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "public"."posts"("slug");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "public"."posts"("slug");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "public"."posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_published_idx" ON "public"."posts"("published");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "public"."posts"("status");

-- CreateIndex
CREATE INDEX "posts_publishedAt_idx" ON "public"."posts"("publishedAt");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "public"."posts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "public"."categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "post_tags_postId_idx" ON "public"."post_tags"("postId");

-- CreateIndex
CREATE INDEX "post_tags_tagId_idx" ON "public"."post_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "post_tags_postId_tagId_key" ON "public"."post_tags"("postId", "tagId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "public"."account"("userId");

-- CreateIndex
CREATE INDEX "account_providerId_idx" ON "public"."account"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "public"."account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "badge_category_idx" ON "public"."badge"("category");

-- CreateIndex
CREATE INDEX "badge_isActive_idx" ON "public"."badge"("isActive");

-- CreateIndex
CREATE INDEX "gdpr_requests_userId_idx" ON "public"."gdpr_requests"("userId");

-- CreateIndex
CREATE INDEX "gdpr_requests_email_idx" ON "public"."gdpr_requests"("email");

-- CreateIndex
CREATE INDEX "gdpr_requests_status_idx" ON "public"."gdpr_requests"("status");

-- CreateIndex
CREATE INDEX "gdpr_requests_type_idx" ON "public"."gdpr_requests"("type");

-- CreateIndex
CREATE INDEX "gdpr_requests_requestDate_idx" ON "public"."gdpr_requests"("requestDate");

-- CreateIndex
CREATE INDEX "gdpr_requests_dueDate_idx" ON "public"."gdpr_requests"("dueDate");

-- CreateIndex
CREATE INDEX "profile_userId_idx" ON "public"."profile"("userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "public"."session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "public"."session"("expiresAt");

-- CreateIndex
CREATE INDEX "session_isActive_idx" ON "public"."session"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_slug_key" ON "public"."user"("slug");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_slug_idx" ON "public"."user"("slug");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "public"."user"("role");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "public"."user"("status");

-- CreateIndex
CREATE INDEX "user_createdAt_idx" ON "public"."user"("createdAt");

-- CreateIndex
CREATE INDEX "user_badge_userId_idx" ON "public"."user_badge"("userId");

-- CreateIndex
CREATE INDEX "user_badge_badgeId_idx" ON "public"."user_badge"("badgeId");

-- CreateIndex
CREATE INDEX "user_badge_earnedAt_idx" ON "public"."user_badge"("earnedAt");

-- CreateIndex
CREATE INDEX "user_consents_userId_idx" ON "public"."user_consents"("userId");

-- CreateIndex
CREATE INDEX "user_consents_consentDate_idx" ON "public"."user_consents"("consentDate");

-- CreateIndex
CREATE INDEX "verification_identifier_type_idx" ON "public"."verification"("identifier", "type");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "public"."verification"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."gdpr_requests" ADD CONSTRAINT "gdpr_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

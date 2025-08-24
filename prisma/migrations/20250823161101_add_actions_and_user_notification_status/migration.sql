-- CreateEnum
CREATE TYPE "public"."AbcRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "public"."ActionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."actions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "summary" VARCHAR(280),
    "coverImage" TEXT,
    "gallery" TEXT[],
    "status" "public"."ActionStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_notification_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_registrations" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "profession" TEXT,
    "company" TEXT,
    "siret" TEXT,
    "membershipType" "public"."AbcMemberType" NOT NULL DEFAULT 'ACTIF',
    "motivation" TEXT,
    "interests" TEXT,
    "status" "public"."AbcRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "adminNotes" TEXT,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actions_slug_key" ON "public"."actions"("slug");

-- CreateIndex
CREATE INDEX "actions_status_idx" ON "public"."actions"("status");

-- CreateIndex
CREATE INDEX "actions_isActive_idx" ON "public"."actions"("isActive");

-- CreateIndex
CREATE INDEX "actions_isFeatured_idx" ON "public"."actions"("isFeatured");

-- CreateIndex
CREATE INDEX "actions_sortOrder_idx" ON "public"."actions"("sortOrder");

-- CreateIndex
CREATE INDEX "actions_publishedAt_idx" ON "public"."actions"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_status_userId_notificationId_key" ON "public"."user_notification_status"("userId", "notificationId");

-- CreateIndex
CREATE INDEX "abc_registrations_status_idx" ON "public"."abc_registrations"("status");

-- CreateIndex
CREATE INDEX "abc_registrations_email_idx" ON "public"."abc_registrations"("email");

-- CreateIndex
CREATE INDEX "abc_registrations_createdAt_idx" ON "public"."abc_registrations"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_notification_status" ADD CONSTRAINT "user_notification_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_registrations" ADD CONSTRAINT "abc_registrations_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

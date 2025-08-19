-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'CANCELLED', 'POSTPONED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."EventCategory" AS ENUM ('CONFERENCE', 'CONCERT', 'FESTIVAL', 'WORKSHOP', 'SEMINAR', 'EXHIBITION', 'SPORT', 'CULTURAL', 'SOCIAL', 'BUSINESS', 'EDUCATIONAL', 'ENTERTAINMENT', 'CHARITY', 'RELIGIOUS', 'POLITICAL', 'FAMILY', 'FOOD', 'HEALTH', 'TECHNOLOGY', 'ART', 'MUSIC', 'THEATER', 'CINEMA', 'BOOK', 'NATURE', 'TOURISM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."ParticipationStatus" AS ENUM ('INTERESTED', 'GOING', 'MAYBE', 'NOT_GOING', 'CANCELLED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "public"."NewsletterFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."NewsletterType" AS ENUM ('NEWSLETTER', 'ANNOUNCEMENT', 'EVENT_DIGEST', 'PLACE_UPDATE', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'ERROR', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AbcMemberType" AS ENUM ('ACTIF', 'ARTISAN', 'AUTO_ENTREPRENEUR', 'PARTENAIRE', 'BIENFAITEUR');

-- CreateEnum
CREATE TYPE "public"."AbcMemberRole" AS ENUM ('MEMBRE', 'SECRETAIRE', 'TRESORIER', 'PRESIDENT', 'VICE_PRESIDENT');

-- CreateEnum
CREATE TYPE "public"."AbcMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."AbcPaymentMode" AS ENUM ('CHEQUE', 'ESPECE', 'VIREMENT');

-- CreateEnum
CREATE TYPE "public"."AbcPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."AbcMeetingType" AS ENUM ('GENERAL', 'BUREAU', 'EXTRAORDINAIRE', 'COMMISSION');

-- CreateEnum
CREATE TYPE "public"."AbcMeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AbcAttendanceStatus" AS ENUM ('INVITED', 'CONFIRMED', 'PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "public"."AbcDocumentType" AS ENUM ('MINUTES', 'AGENDA', 'FINANCIAL', 'LEGAL', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AbcDocumentAccess" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- DropIndex
DROP INDEX "public"."opening_hours_placeId_dayOfWeek_openTime_closeTime_key";

-- AlterTable
ALTER TABLE "public"."opening_hours" ALTER COLUMN "openTime" DROP NOT NULL,
ALTER COLUMN "closeTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."post_views" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL DEFAULT '',
    "referer" TEXT NOT NULL DEFAULT '',
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."place_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT DEFAULT '#6B7280',
    "bgColor" TEXT DEFAULT 'bg-gray-100',
    "textColor" TEXT DEFAULT 'text-gray-700',
    "borderColor" TEXT DEFAULT 'border-gray-200',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeCount" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."place_to_categories" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_to_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."google_reviews" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "googleReviewId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorUrl" TEXT,
    "googleTime" INTEGER NOT NULL,
    "relativeTime" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" VARCHAR(280),
    "status" "public"."EventStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizerId" TEXT,
    "placeId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "ticketUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRuleId" TEXT,
    "parentEventId" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "locationCity" TEXT,
    "locationLatitude" DOUBLE PRECISION,
    "locationLongitude" DOUBLE PRECISION,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "waitingList" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "price" DOUBLE PRECISION,
    "priceDetails" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "logo" TEXT,
    "coverImage" TEXT,
    "images" JSONB,
    "videos" JSONB,
    "metaTitle" VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "ogImage" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "tiktok" TEXT,
    "tags" JSONB,
    "category" "public"."EventCategory",
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recurrence_rules" (
    "id" TEXT NOT NULL,
    "frequency" "public"."RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER,
    "until" TIMESTAMP(3),
    "byWeekDay" JSONB,
    "byMonthDay" JSONB,
    "byMonth" JSONB,
    "exceptions" JSONB,
    "workdaysOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."ParticipationStatus" NOT NULL DEFAULT 'INTERESTED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "specialNeeds" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "type" "public"."ReminderType" NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "unsubscribeToken" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEmailSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_preferences" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "events" BOOLEAN NOT NULL DEFAULT true,
    "places" BOOLEAN NOT NULL DEFAULT true,
    "offers" BOOLEAN NOT NULL DEFAULT false,
    "news" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "public"."NewsletterFrequency" NOT NULL DEFAULT 'WEEKLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."NewsletterType" NOT NULL DEFAULT 'NEWSLETTER',
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "includedEvents" TEXT[],
    "includedPlaces" TEXT[],
    "includedPosts" TEXT[],
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_campaign_sent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "messageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_campaign_sent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_attachments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_queue" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."AbcMemberType" NOT NULL,
    "role" "public"."AbcMemberRole" NOT NULL DEFAULT 'MEMBRE',
    "status" "public"."AbcMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "memberNumber" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_payments" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" "public"."AbcPaymentMode" NOT NULL,
    "status" "public"."AbcPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "checkNumber" TEXT,
    "reference" TEXT,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AbcMeetingType" NOT NULL DEFAULT 'GENERAL',
    "status" "public"."AbcMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "location" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_meeting_attendees" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "public"."AbcAttendanceStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_meeting_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AbcDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "meetingId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_document_shares" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accessLevel" "public"."AbcDocumentAccess" NOT NULL DEFAULT 'READ',
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abc_document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abc_bulletins" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "meetingId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abc_bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_views_postId_idx" ON "public"."post_views"("postId");

-- CreateIndex
CREATE INDEX "post_views_ipAddress_idx" ON "public"."post_views"("ipAddress");

-- CreateIndex
CREATE INDEX "post_views_createdAt_idx" ON "public"."post_views"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "place_categories_name_key" ON "public"."place_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "place_categories_slug_key" ON "public"."place_categories"("slug");

-- CreateIndex
CREATE INDEX "place_categories_slug_idx" ON "public"."place_categories"("slug");

-- CreateIndex
CREATE INDEX "place_categories_parentId_idx" ON "public"."place_categories"("parentId");

-- CreateIndex
CREATE INDEX "place_categories_isActive_idx" ON "public"."place_categories"("isActive");

-- CreateIndex
CREATE INDEX "place_categories_sortOrder_idx" ON "public"."place_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "place_to_categories_placeId_idx" ON "public"."place_to_categories"("placeId");

-- CreateIndex
CREATE INDEX "place_to_categories_categoryId_idx" ON "public"."place_to_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "place_to_categories_placeId_categoryId_key" ON "public"."place_to_categories"("placeId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "google_reviews_googleReviewId_key" ON "public"."google_reviews"("googleReviewId");

-- CreateIndex
CREATE INDEX "google_reviews_placeId_idx" ON "public"."google_reviews"("placeId");

-- CreateIndex
CREATE INDEX "google_reviews_rating_idx" ON "public"."google_reviews"("rating");

-- CreateIndex
CREATE INDEX "google_reviews_googleReviewId_idx" ON "public"."google_reviews"("googleReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "public"."events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_recurrenceRuleId_key" ON "public"."events"("recurrenceRuleId");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "public"."events"("slug");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_isPublished_idx" ON "public"."events"("isPublished");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_endDate_idx" ON "public"."events"("endDate");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "public"."events"("organizerId");

-- CreateIndex
CREATE INDEX "events_placeId_idx" ON "public"."events"("placeId");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "public"."events"("category");

-- CreateIndex
CREATE INDEX "events_locationCity_idx" ON "public"."events"("locationCity");

-- CreateIndex
CREATE INDEX "event_participants_eventId_idx" ON "public"."event_participants"("eventId");

-- CreateIndex
CREATE INDEX "event_participants_userId_idx" ON "public"."event_participants"("userId");

-- CreateIndex
CREATE INDEX "event_participants_status_idx" ON "public"."event_participants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventId_userId_key" ON "public"."event_participants"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_reminders_eventId_idx" ON "public"."event_reminders"("eventId");

-- CreateIndex
CREATE INDEX "event_reminders_userId_idx" ON "public"."event_reminders"("userId");

-- CreateIndex
CREATE INDEX "event_reminders_reminderTime_idx" ON "public"."event_reminders"("reminderTime");

-- CreateIndex
CREATE INDEX "event_reminders_sent_idx" ON "public"."event_reminders"("sent");

-- CreateIndex
CREATE UNIQUE INDEX "event_reminders_eventId_userId_reminderTime_key" ON "public"."event_reminders"("eventId", "userId", "reminderTime");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "public"."newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_verificationToken_key" ON "public"."newsletter_subscribers"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "public"."newsletter_subscribers"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_preferences_subscriberId_key" ON "public"."newsletter_preferences"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_campaign_sent_campaignId_subscriberId_key" ON "public"."newsletter_campaign_sent"("campaignId", "subscriberId");

-- CreateIndex
CREATE INDEX "newsletter_attachments_campaignId_idx" ON "public"."newsletter_attachments"("campaignId");

-- CreateIndex
CREATE INDEX "newsletter_queue_status_scheduledAt_idx" ON "public"."newsletter_queue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "newsletter_queue_campaignId_idx" ON "public"."newsletter_queue"("campaignId");

-- CreateIndex
CREATE INDEX "newsletter_queue_subscriberId_idx" ON "public"."newsletter_queue"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "abc_members_userId_key" ON "public"."abc_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "abc_members_memberNumber_key" ON "public"."abc_members"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "abc_payments_memberId_year_quarter_key" ON "public"."abc_payments"("memberId", "year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "abc_meeting_attendees_meetingId_memberId_key" ON "public"."abc_meeting_attendees"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "abc_document_shares_documentId_memberId_key" ON "public"."abc_document_shares"("documentId", "memberId");

-- AddForeignKey
ALTER TABLE "public"."post_views" ADD CONSTRAINT "post_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."place_categories" ADD CONSTRAINT "place_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."place_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."place_to_categories" ADD CONSTRAINT "place_to_categories_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."place_to_categories" ADD CONSTRAINT "place_to_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."place_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."google_reviews" ADD CONSTRAINT "google_reviews_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_recurrenceRuleId_fkey" FOREIGN KEY ("recurrenceRuleId") REFERENCES "public"."recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reminders" ADD CONSTRAINT "event_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reminders" ADD CONSTRAINT "event_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_preferences" ADD CONSTRAINT "newsletter_preferences_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_campaign_sent" ADD CONSTRAINT "newsletter_campaign_sent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_campaign_sent" ADD CONSTRAINT "newsletter_campaign_sent_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_attachments" ADD CONSTRAINT "newsletter_attachments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_attachments" ADD CONSTRAINT "newsletter_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_queue" ADD CONSTRAINT "newsletter_queue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_queue" ADD CONSTRAINT "newsletter_queue_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_members" ADD CONSTRAINT "abc_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_payments" ADD CONSTRAINT "abc_payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."abc_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_meetings" ADD CONSTRAINT "abc_meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_meeting_attendees" ADD CONSTRAINT "abc_meeting_attendees_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."abc_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_meeting_attendees" ADD CONSTRAINT "abc_meeting_attendees_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."abc_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_documents" ADD CONSTRAINT "abc_documents_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."abc_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_documents" ADD CONSTRAINT "abc_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_document_shares" ADD CONSTRAINT "abc_document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."abc_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_document_shares" ADD CONSTRAINT "abc_document_shares_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."abc_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_bulletins" ADD CONSTRAINT "abc_bulletins_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."abc_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abc_bulletins" ADD CONSTRAINT "abc_bulletins_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

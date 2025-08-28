/*
  Warnings:

  - Added the required column `cotisationAmount` to the `abc_registrations` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `abc_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `abc_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postalCode` on table `abc_registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."AbcPaymentMethod" AS ENUM ('CHEQUE', 'VIREMENT', 'ESPECES');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'DISCONTINUED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ProductPriceType" AS ENUM ('FIXED', 'VARIABLE', 'ON_REQUEST', 'FREE');

-- CreateEnum
CREATE TYPE "public"."ServiceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNAVAILABLE', 'DISCONTINUED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ServicePriceType" AS ENUM ('FIXED', 'HOURLY', 'DAILY', 'VARIABLE', 'ON_REQUEST', 'FREE');

-- CreateEnum
CREATE TYPE "public"."OfferType" AS ENUM ('DISCOUNT', 'FREEBIE', 'BUNDLE', 'LOYALTY', 'SEASONAL', 'LIMITED_TIME');

-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "public"."PartnerType" AS ENUM ('COMMERCIAL', 'INSTITUTIONAL', 'MEDIA', 'TECHNICAL', 'SPONSOR', 'SUPPLIER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."WhatsAppMessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'STICKER', 'INTERACTIVE', 'BUTTON', 'LIST');

-- CreateEnum
CREATE TYPE "public"."WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."abc_registrations" ADD COLUMN     "acceptsCotisation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsReglement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsStatuts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "commercialName" TEXT,
ADD COLUMN     "cotisationAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paymentMethod" "public"."AbcPaymentMethod" NOT NULL DEFAULT 'CHEQUE',
ADD COLUMN     "website" TEXT,
ALTER COLUMN "birthDate" SET DATA TYPE TEXT,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."places" ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "placeId" TEXT;

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" VARCHAR(280),
    "price" DOUBLE PRECISION,
    "priceType" "public"."ProductPriceType" NOT NULL DEFAULT 'FIXED',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "unit" TEXT,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,
    "minQuantity" INTEGER DEFAULT 1,
    "maxQuantity" INTEGER,
    "coverImage" TEXT,
    "images" JSONB,
    "category" TEXT,
    "tags" JSONB,
    "specifications" JSONB,
    "placeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" VARCHAR(280),
    "price" DOUBLE PRECISION,
    "priceType" "public"."ServicePriceType" NOT NULL DEFAULT 'FIXED',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "unit" TEXT,
    "duration" INTEGER,
    "status" "public"."ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "requiresBooking" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "images" JSONB,
    "category" TEXT,
    "tags" JSONB,
    "features" JSONB,
    "placeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" VARCHAR(280),
    "type" "public"."OfferType" NOT NULL DEFAULT 'DISCOUNT',
    "discountType" "public"."DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "discountMaxAmount" DOUBLE PRECISION,
    "minimumPurchase" DOUBLE PRECISION,
    "status" "public"."OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT,
    "requiresCode" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "images" JSONB,
    "placeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_offers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_offers" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "partnerType" "public"."PartnerType" NOT NULL DEFAULT 'COMMERCIAL',
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."history_config" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "heroImage" TEXT,
    "visionTitle" TEXT,
    "visionDescription" TEXT,
    "visionImage" TEXT,
    "primaryButtonText" TEXT,
    "primaryButtonUrl" TEXT,
    "secondaryButtonText" TEXT,
    "secondaryButtonUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."history_milestone" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."history_timeline_event" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_timeline_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastMessage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "content" TEXT NOT NULL,
    "messageType" "public"."WhatsAppMessageType" NOT NULL DEFAULT 'TEXT',
    "isFromBot" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_bot_sessions" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "currentFlow" TEXT,
    "currentStep" TEXT,
    "context" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_bot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_bot_config" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Bonjour ! Je suis l''assistant d''ABC Bédarieux. Comment puis-je vous aider ?',
    "messages" JSONB NOT NULL,
    "flows" JSONB NOT NULL,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 3600,
    "maxMessages" INTEGER NOT NULL DEFAULT 100,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_bot_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_bot_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "textMessages" INTEGER NOT NULL DEFAULT 0,
    "imageMessages" INTEGER NOT NULL DEFAULT 0,
    "locationMessages" INTEGER NOT NULL DEFAULT 0,
    "contactMessages" INTEGER NOT NULL DEFAULT 0,
    "searchQueries" INTEGER NOT NULL DEFAULT 0,
    "eventQueries" INTEGER NOT NULL DEFAULT 0,
    "placeQueries" INTEGER NOT NULL DEFAULT 0,
    "helpRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_bot_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_placeId_idx" ON "public"."products"("placeId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "public"."products"("status");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "public"."products"("isActive");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "public"."products"("category");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "public"."products"("slug");

-- CreateIndex
CREATE INDEX "services_placeId_idx" ON "public"."services"("placeId");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "public"."services"("status");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "public"."services"("isActive");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "public"."services"("category");

-- CreateIndex
CREATE INDEX "services_slug_idx" ON "public"."services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "offers_code_key" ON "public"."offers"("code");

-- CreateIndex
CREATE INDEX "offers_placeId_idx" ON "public"."offers"("placeId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "public"."offers"("status");

-- CreateIndex
CREATE INDEX "offers_isActive_idx" ON "public"."offers"("isActive");

-- CreateIndex
CREATE INDEX "offers_code_idx" ON "public"."offers"("code");

-- CreateIndex
CREATE INDEX "offers_startDate_idx" ON "public"."offers"("startDate");

-- CreateIndex
CREATE INDEX "offers_endDate_idx" ON "public"."offers"("endDate");

-- CreateIndex
CREATE INDEX "offers_slug_idx" ON "public"."offers"("slug");

-- CreateIndex
CREATE INDEX "product_offers_productId_idx" ON "public"."product_offers"("productId");

-- CreateIndex
CREATE INDEX "product_offers_offerId_idx" ON "public"."product_offers"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "product_offers_productId_offerId_key" ON "public"."product_offers"("productId", "offerId");

-- CreateIndex
CREATE INDEX "service_offers_serviceId_idx" ON "public"."service_offers"("serviceId");

-- CreateIndex
CREATE INDEX "service_offers_offerId_idx" ON "public"."service_offers"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "service_offers_serviceId_offerId_key" ON "public"."service_offers"("serviceId", "offerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_slug_key" ON "public"."partner"("slug");

-- CreateIndex
CREATE INDEX "partner_slug_idx" ON "public"."partner"("slug");

-- CreateIndex
CREATE INDEX "partner_partnerType_idx" ON "public"."partner"("partnerType");

-- CreateIndex
CREATE INDEX "partner_isActive_idx" ON "public"."partner"("isActive");

-- CreateIndex
CREATE INDEX "partner_priority_idx" ON "public"."partner"("priority");

-- CreateIndex
CREATE INDEX "partner_createdAt_idx" ON "public"."partner"("createdAt");

-- CreateIndex
CREATE INDEX "history_milestone_configId_order_idx" ON "public"."history_milestone"("configId", "order");

-- CreateIndex
CREATE INDEX "history_timeline_event_configId_order_idx" ON "public"."history_timeline_event"("configId", "order");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_phoneNumber_idx" ON "public"."whatsapp_conversations"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_isActive_idx" ON "public"."whatsapp_conversations"("isActive");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_lastMessage_idx" ON "public"."whatsapp_conversations"("lastMessage");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_phoneNumber_key" ON "public"."whatsapp_conversations"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "public"."whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_messageId_idx" ON "public"."whatsapp_messages"("messageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_isFromBot_idx" ON "public"."whatsapp_messages"("isFromBot");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_idx" ON "public"."whatsapp_messages"("status");

-- CreateIndex
CREATE INDEX "whatsapp_messages_createdAt_idx" ON "public"."whatsapp_messages"("createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_phoneNumber_idx" ON "public"."whatsapp_bot_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_isActive_idx" ON "public"."whatsapp_bot_sessions"("isActive");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_expiresAt_idx" ON "public"."whatsapp_bot_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_bot_sessions_phoneNumber_key" ON "public"."whatsapp_bot_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_bot_stats_date_idx" ON "public"."whatsapp_bot_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_bot_stats_date_key" ON "public"."whatsapp_bot_stats"("date");

-- CreateIndex
CREATE INDEX "posts_placeId_idx" ON "public"."posts"("placeId");

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_offers" ADD CONSTRAINT "product_offers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_offers" ADD CONSTRAINT "product_offers_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_offers" ADD CONSTRAINT "service_offers_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_offers" ADD CONSTRAINT "service_offers_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history_config" ADD CONSTRAINT "history_config_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history_milestone" ADD CONSTRAINT "history_milestone_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."history_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history_timeline_event" ADD CONSTRAINT "history_timeline_event_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."history_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_bot_config" ADD CONSTRAINT "whatsapp_bot_config_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

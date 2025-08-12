-- CreateEnum
CREATE TYPE "public"."PlaceType" AS ENUM ('COMMERCE', 'SERVICE', 'RESTAURANT', 'ARTISAN', 'ADMINISTRATION', 'MUSEUM', 'TOURISM', 'PARK', 'LEISURE', 'ASSOCIATION', 'HEALTH', 'EDUCATION', 'TRANSPORT', 'ACCOMMODATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PlaceStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "coverImage" TEXT;

-- CreateTable
CREATE TABLE "public"."places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."PlaceType" NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "summary" VARCHAR(280),
    "status" "public"."PlaceStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "googlePlaceId" TEXT,
    "googleMapsUrl" TEXT,
    "googleBusinessData" JSONB,
    "lastGoogleSync" TIMESTAMP(3),
    "ownerId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street" TEXT NOT NULL,
    "streetNumber" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "tiktok" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "images" JSONB,
    "metaTitle" VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "ogImage" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."opening_hours" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "googleReviewId" TEXT,
    "isGoogleReview" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."place_claims" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "proof" TEXT,
    "status" "public"."ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "adminMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "public"."places"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "places_googlePlaceId_key" ON "public"."places"("googlePlaceId");

-- CreateIndex
CREATE INDEX "places_slug_idx" ON "public"."places"("slug");

-- CreateIndex
CREATE INDEX "places_type_idx" ON "public"."places"("type");

-- CreateIndex
CREATE INDEX "places_status_idx" ON "public"."places"("status");

-- CreateIndex
CREATE INDEX "places_googlePlaceId_idx" ON "public"."places"("googlePlaceId");

-- CreateIndex
CREATE INDEX "places_postalCode_city_idx" ON "public"."places"("postalCode", "city");

-- CreateIndex
CREATE INDEX "places_latitude_longitude_idx" ON "public"."places"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "opening_hours_placeId_dayOfWeek_idx" ON "public"."opening_hours"("placeId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_googleReviewId_key" ON "public"."reviews"("googleReviewId");

-- CreateIndex
CREATE INDEX "reviews_placeId_idx" ON "public"."reviews"("placeId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "public"."reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_placeId_userId_key" ON "public"."reviews"("placeId", "userId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "public"."favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_placeId_idx" ON "public"."favorites"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_placeId_key" ON "public"."favorites"("userId", "placeId");

-- CreateIndex
CREATE INDEX "place_claims_placeId_idx" ON "public"."place_claims"("placeId");

-- CreateIndex
CREATE INDEX "place_claims_userId_idx" ON "public"."place_claims"("userId");

-- CreateIndex
CREATE INDEX "place_claims_status_idx" ON "public"."place_claims"("status");

-- AddForeignKey
ALTER TABLE "public"."places" ADD CONSTRAINT "places_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opening_hours" ADD CONSTRAINT "opening_hours_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."place_claims" ADD CONSTRAINT "place_claims_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."place_claims" ADD CONSTRAINT "place_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

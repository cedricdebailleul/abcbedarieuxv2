-- CreateTable
CREATE TABLE "place_views" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "referer" TEXT NOT NULL DEFAULT '',
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_views" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "referer" TEXT NOT NULL DEFAULT '',
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_views_placeId_idx" ON "place_views"("placeId");

-- CreateIndex
CREATE INDEX "place_views_ipAddress_idx" ON "place_views"("ipAddress");

-- CreateIndex
CREATE INDEX "place_views_createdAt_idx" ON "place_views"("createdAt");

-- CreateIndex
CREATE INDEX "event_views_eventId_idx" ON "event_views"("eventId");

-- CreateIndex
CREATE INDEX "event_views_ipAddress_idx" ON "event_views"("ipAddress");

-- CreateIndex
CREATE INDEX "event_views_createdAt_idx" ON "event_views"("createdAt");

-- AddForeignKey
ALTER TABLE "place_views" ADD CONSTRAINT "place_views_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_views" ADD CONSTRAINT "event_views_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[placeId,dayOfWeek,openTime,closeTime]` on the table `opening_hours` will be added. If there are existing duplicate values, this will fail.
  - Made the column `openTime` on table `opening_hours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `closeTime` on table `opening_hours` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."opening_hours" ALTER COLUMN "openTime" SET NOT NULL,
ALTER COLUMN "closeTime" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "opening_hours_placeId_dayOfWeek_openTime_closeTime_key" ON "public"."opening_hours"("placeId", "dayOfWeek", "openTime", "closeTime");

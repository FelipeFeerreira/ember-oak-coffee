-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('COFFEE', 'BUNDLE', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "RoastLevel" AS ENUM ('LIGHT', 'MEDIUM', 'MEDIUM_DARK', 'DARK');

-- CreateEnum
CREATE TYPE "Acidity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "BrewMethod" AS ENUM ('ESPRESSO', 'FILTER', 'FRENCH_PRESS', 'COLD_BREW');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "weightGrams" INTEGER,
    "origin" TEXT,
    "region" TEXT,
    "process" TEXT,
    "tastingNotes" TEXT[],
    "roastLevel" "RoastLevel",
    "acidity" "Acidity",
    "brewMethods" "BrewMethod"[],
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_roastLevel_idx" ON "Product"("roastLevel");

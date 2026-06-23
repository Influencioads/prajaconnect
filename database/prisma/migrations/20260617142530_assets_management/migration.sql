-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('Roads', 'Taxes', 'ReligiousPlaces', 'DevelopmentWorks', 'DealerShops', 'BurialGrounds', 'Hospitals', 'Schools', 'DwcraGroups', 'Tanks', 'RwsAssets', 'GreenAmbassadors', 'GovernmentOffices');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('Active', 'Inactive', 'UnderMaintenance', 'UnderDevelopment', 'Decommissioned');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('Good', 'Fair', 'Damaged', 'Critical');

-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "assetId" TEXT;

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'Active',
    "condition" "AssetCondition",
    "contractor" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "wardNumber" TEXT,
    "villageId" TEXT,
    "mandalId" TEXT,
    "constituencyId" TEXT,
    "departmentId" TEXT,
    "projectId" TEXT,
    "attributes" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_photos" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_documents" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance_logs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT,
    "cost" DOUBLE PRECISION,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory",
    "scope" TEXT NOT NULL DEFAULT 'constituency',
    "params" JSONB,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "roadType" TEXT,
    "lengthKm" DOUBLE PRECISION,
    "widthM" DOUBLE PRECISION,
    "lastRepairDate" TIMESTAMP(3),

    CONSTRAINT "road_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "hospitalType" TEXT,
    "doctorsCount" INTEGER NOT NULL DEFAULT 0,
    "bedsCount" INTEGER NOT NULL DEFAULT 0,
    "ambulances" INTEGER NOT NULL DEFAULT 0,
    "emergencyContact" TEXT,
    "services" TEXT,

    CONSTRAINT "hospital_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "schoolType" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "teacherCount" INTEGER NOT NULL DEFAULT 0,
    "midDayMeal" BOOLEAN NOT NULL DEFAULT false,
    "performanceScore" DOUBLE PRECISION,

    CONSTRAINT "school_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rws_assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetType" TEXT,
    "functional" BOOLEAN NOT NULL DEFAULT true,
    "distributionStatus" TEXT,

    CONSTRAINT "rws_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_mandalId_idx" ON "assets"("mandalId");

-- CreateIndex
CREATE INDEX "assets_villageId_idx" ON "assets"("villageId");

-- CreateIndex
CREATE INDEX "assets_constituencyId_idx" ON "assets"("constituencyId");

-- CreateIndex
CREATE INDEX "assets_createdAt_idx" ON "assets"("createdAt");

-- CreateIndex
CREATE INDEX "asset_photos_assetId_idx" ON "asset_photos"("assetId");

-- CreateIndex
CREATE INDEX "asset_documents_assetId_idx" ON "asset_documents"("assetId");

-- CreateIndex
CREATE INDEX "asset_maintenance_logs_assetId_idx" ON "asset_maintenance_logs"("assetId");

-- CreateIndex
CREATE INDEX "asset_maintenance_logs_performedAt_idx" ON "asset_maintenance_logs"("performedAt");

-- CreateIndex
CREATE INDEX "asset_reports_category_idx" ON "asset_reports"("category");

-- CreateIndex
CREATE UNIQUE INDEX "road_assets_assetId_key" ON "road_assets"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_assets_assetId_key" ON "hospital_assets"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "school_assets_assetId_key" ON "school_assets"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "rws_assets_assetId_key" ON "rws_assets"("assetId");

-- CreateIndex
CREATE INDEX "Grievance_assetId_idx" ON "Grievance"("assetId");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_photos" ADD CONSTRAINT "asset_photos_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_logs" ADD CONSTRAINT "asset_maintenance_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_assets" ADD CONSTRAINT "road_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_assets" ADD CONSTRAINT "hospital_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_assets" ADD CONSTRAINT "school_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rws_assets" ADD CONSTRAINT "rws_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

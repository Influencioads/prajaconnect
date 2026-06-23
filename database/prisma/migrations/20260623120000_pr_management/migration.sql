-- CreateEnum
CREATE TYPE "PrIngestionRunStatus" AS ENUM ('Running', 'Completed', 'Partial', 'Failed');

-- CreateEnum
CREATE TYPE "PrAlertType" AS ENUM ('NegativePR', 'TimelineViolation', 'SeriousConcern', 'ReputationDrop');

-- CreateEnum
CREATE TYPE "PrAlertSeverity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "PrAlertStatus" AS ENUM ('Open', 'Acknowledged', 'Resolved');

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'te',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrIngestionRun" (
    "id" TEXT NOT NULL,
    "status" "PrIngestionRunStatus" NOT NULL DEFAULT 'Running',
    "sourcesChecked" INTEGER NOT NULL DEFAULT 0,
    "articlesFetched" INTEGER NOT NULL DEFAULT 0,
    "articlesNew" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PrIngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrReport" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "mustCoverJson" JSONB,
    "negativePrJson" JSONB,
    "statsJson" JSONB,
    "generatedBy" TEXT NOT NULL DEFAULT 'openai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrAlert" (
    "id" TEXT NOT NULL,
    "type" "PrAlertType" NOT NULL,
    "severity" "PrAlertSeverity" NOT NULL DEFAULT 'Medium',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "PrAlertStatus" NOT NULL DEFAULT 'Open',
    "linkedArticleId" TEXT,
    "linkedAttackId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrAlert_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "NewsArticle" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "importanceScore" INTEGER,
ADD COLUMN     "aiSeverity" TEXT,
ADD COLUMN     "coverageRecommendation" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "ingestionRunId" TEXT;

-- AlterTable
ALTER TABLE "OppositionAttack" ADD COLUMN     "articleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_url_key" ON "NewsSource"("url");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_contentHash_key" ON "NewsArticle"("contentHash");

-- CreateIndex
CREATE INDEX "NewsArticle_sourceId_idx" ON "NewsArticle"("sourceId");

-- CreateIndex
CREATE INDEX "NewsArticle_processedAt_idx" ON "NewsArticle"("processedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_importanceScore_idx" ON "NewsArticle"("importanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "PrAlert_dedupeKey_key" ON "PrAlert"("dedupeKey");

-- CreateIndex
CREATE INDEX "PrAlert_status_idx" ON "PrAlert"("status");

-- CreateIndex
CREATE INDEX "PrAlert_severity_idx" ON "PrAlert"("severity");

-- CreateIndex
CREATE INDEX "PrAlert_type_idx" ON "PrAlert"("type");

-- CreateIndex
CREATE INDEX "OppositionAttack_articleId_idx" ON "OppositionAttack"("articleId");

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "PrIngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OppositionAttack" ADD CONSTRAINT "OppositionAttack_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrAlert" ADD CONSTRAINT "PrAlert_linkedArticleId_fkey" FOREIGN KEY ("linkedArticleId") REFERENCES "NewsArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrAlert" ADD CONSTRAINT "PrAlert_linkedAttackId_fkey" FOREIGN KEY ("linkedAttackId") REFERENCES "OppositionAttack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrAlert" ADD CONSTRAINT "PrAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

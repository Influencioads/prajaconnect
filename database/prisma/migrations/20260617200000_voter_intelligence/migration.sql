-- CreateEnum
CREATE TYPE "VoterPreference" AS ENUM ('Supporter', 'Neutral', 'Opponent', 'Swing', 'Unknown');

-- CreateEnum
CREATE TYPE "VoterIntelligenceSource" AS ENUM ('D2D', 'Election', 'Manual', 'Import');

-- CreateEnum
CREATE TYPE "VoterDuplicateStatus" AS ENUM ('Pending', 'Confirmed', 'Rejected');

-- CreateEnum
CREATE TYPE "VoterImportBatchStatus" AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');

-- CreateTable
CREATE TABLE "VoterSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#003366',
    "ruleJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoterSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterIntelligenceProfile" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "preference" "VoterPreference" NOT NULL DEFAULT 'Unknown',
    "isKeyVoter" BOOLEAN NOT NULL DEFAULT false,
    "isInfluencer" BOOLEAN NOT NULL DEFAULT false,
    "isSwing" BOOLEAN NOT NULL DEFAULT false,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "segmentId" TEXT,
    "lastAssessedAt" TIMESTAMP(3),
    "source" "VoterIntelligenceSource" NOT NULL DEFAULT 'Manual',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoterIntelligenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyVoterPreference" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "dominantPreference" "VoterPreference" NOT NULL DEFAULT 'Unknown',
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "opponentCount" INTEGER NOT NULL DEFAULT 0,
    "swingCount" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyVoterPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothVoterStrength" (
    "id" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "opponentCount" INTEGER NOT NULL DEFAULT 0,
    "swingCount" INTEGER NOT NULL DEFAULT 0,
    "totalProfiles" INTEGER NOT NULL DEFAULT 0,
    "supporterPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strengthLabel" "BoothStrength" NOT NULL DEFAULT 'Weak',
    "priorityBoothScore" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoothVoterStrength_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "VoterImportBatchStatus" NOT NULL DEFAULT 'Pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "matchedRows" INTEGER NOT NULL DEFAULT 0,
    "unmatchedRows" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoterImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectoralRollEntry" (
    "id" TEXT NOT NULL,
    "epicNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationName" TEXT,
    "age" INTEGER,
    "gender" "Gender",
    "partNo" TEXT,
    "serialNo" TEXT,
    "address" TEXT,
    "boothId" TEXT,
    "importBatchId" TEXT,
    "matchedCitizenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectoralRollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterDuplicateCandidate" (
    "id" TEXT NOT NULL,
    "citizenIdA" TEXT NOT NULL,
    "citizenIdB" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchReason" TEXT,
    "status" "VoterDuplicateStatus" NOT NULL DEFAULT 'Pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoterDuplicateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterIntelligenceChangeLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoterIntelligenceChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoterSegment_name_key" ON "VoterSegment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VoterIntelligenceProfile_citizenId_key" ON "VoterIntelligenceProfile"("citizenId");

-- CreateIndex
CREATE INDEX "VoterIntelligenceProfile_preference_idx" ON "VoterIntelligenceProfile"("preference");

-- CreateIndex
CREATE INDEX "VoterIntelligenceProfile_segmentId_idx" ON "VoterIntelligenceProfile"("segmentId");

-- CreateIndex
CREATE INDEX "VoterIntelligenceProfile_priorityScore_idx" ON "VoterIntelligenceProfile"("priorityScore");

-- CreateIndex
CREATE INDEX "VoterIntelligenceProfile_isKeyVoter_idx" ON "VoterIntelligenceProfile"("isKeyVoter");

-- CreateIndex
CREATE INDEX "VoterIntelligenceProfile_isSwing_idx" ON "VoterIntelligenceProfile"("isSwing");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyVoterPreference_familyId_key" ON "FamilyVoterPreference"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "BoothVoterStrength_boothId_key" ON "BoothVoterStrength"("boothId");

-- CreateIndex
CREATE INDEX "ElectoralRollEntry_epicNo_idx" ON "ElectoralRollEntry"("epicNo");

-- CreateIndex
CREATE INDEX "ElectoralRollEntry_boothId_idx" ON "ElectoralRollEntry"("boothId");

-- CreateIndex
CREATE INDEX "ElectoralRollEntry_importBatchId_idx" ON "ElectoralRollEntry"("importBatchId");

-- CreateIndex
CREATE INDEX "ElectoralRollEntry_matchedCitizenId_idx" ON "ElectoralRollEntry"("matchedCitizenId");

-- CreateIndex
CREATE UNIQUE INDEX "VoterDuplicateCandidate_citizenIdA_citizenIdB_key" ON "VoterDuplicateCandidate"("citizenIdA", "citizenIdB");

-- CreateIndex
CREATE INDEX "VoterDuplicateCandidate_status_idx" ON "VoterDuplicateCandidate"("status");

-- CreateIndex
CREATE INDEX "VoterIntelligenceChangeLog_profileId_idx" ON "VoterIntelligenceChangeLog"("profileId");

-- CreateIndex
CREATE INDEX "Citizen_voterId_idx" ON "Citizen"("voterId");

-- AddForeignKey
ALTER TABLE "VoterIntelligenceProfile" ADD CONSTRAINT "VoterIntelligenceProfile_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterIntelligenceProfile" ADD CONSTRAINT "VoterIntelligenceProfile_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "VoterSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyVoterPreference" ADD CONSTRAINT "FamilyVoterPreference_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothVoterStrength" ADD CONSTRAINT "BoothVoterStrength_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterImportBatch" ADD CONSTRAINT "VoterImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralRollEntry" ADD CONSTRAINT "ElectoralRollEntry_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralRollEntry" ADD CONSTRAINT "ElectoralRollEntry_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "VoterImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralRollEntry" ADD CONSTRAINT "ElectoralRollEntry_matchedCitizenId_fkey" FOREIGN KEY ("matchedCitizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterDuplicateCandidate" ADD CONSTRAINT "VoterDuplicateCandidate_citizenIdA_fkey" FOREIGN KEY ("citizenIdA") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterDuplicateCandidate" ADD CONSTRAINT "VoterDuplicateCandidate_citizenIdB_fkey" FOREIGN KEY ("citizenIdB") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterDuplicateCandidate" ADD CONSTRAINT "VoterDuplicateCandidate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterIntelligenceChangeLog" ADD CONSTRAINT "VoterIntelligenceChangeLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "VoterIntelligenceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterIntelligenceChangeLog" ADD CONSTRAINT "VoterIntelligenceChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "TempGrievanceSource" AS ENUM ('Call', 'CampaignCall', 'ConferenceCall', 'WhatsApp', 'WhatsAppBot', 'D2DSurvey', 'Email', 'SMS', 'FieldVisit', 'VolunteerNote', 'Manual');

-- CreateEnum
CREATE TYPE "TempGrievanceStatus" AS ENUM ('New', 'PendingValidation', 'MoreInfoRequired', 'Validated', 'Converted', 'Duplicate', 'Rejected', 'Archived');

-- CreateEnum
CREATE TYPE "TempGrievancePriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "DuplicateRisk" AS ENUM ('None', 'Low', 'Medium', 'High');

-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN "convertedFromTempId" TEXT;

-- CreateTable
CREATE TABLE "temporary_grievances" (
    "id" TEXT NOT NULL,
    "tempTicketId" TEXT NOT NULL,
    "source" "TempGrievanceSource" NOT NULL,
    "sourceReferenceId" TEXT,
    "sourceMetadata" JSONB,
    "citizenId" TEXT,
    "citizenName" TEXT,
    "mobileNumber" TEXT,
    "whatsappNumber" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "wardId" TEXT,
    "address" TEXT,
    "issueCategory" TEXT,
    "issueSummary" TEXT,
    "issueDescription" TEXT,
    "originalMessage" TEXT,
    "voiceRecordingUrl" TEXT,
    "whatsappChatUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priority" "TempGrievancePriority" NOT NULL DEFAULT 'Medium',
    "validationStatus" "TempGrievanceStatus" NOT NULL DEFAULT 'New',
    "duplicateRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duplicateRisk" "DuplicateRisk" NOT NULL DEFAULT 'None',
    "validationChecklist" JSONB,
    "assignedValidatorId" TEXT,
    "createdById" TEXT,
    "convertedGrievanceId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "archivedReason" TEXT,
    "whatsappConversationId" TEXT,
    "d2dSurveyResponseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporary_grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_grievance_media" (
    "id" TEXT NOT NULL,
    "temporaryGrievanceId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_grievance_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_grievance_notes" (
    "id" TEXT NOT NULL,
    "temporaryGrievanceId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_grievance_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_grievance_validation_logs" (
    "id" TEXT NOT NULL,
    "temporaryGrievanceId" TEXT NOT NULL,
    "validationAction" TEXT NOT NULL,
    "oldStatus" "TempGrievanceStatus",
    "newStatus" "TempGrievanceStatus",
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_grievance_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_grievance_duplicates" (
    "id" TEXT NOT NULL,
    "temporaryGrievanceId" TEXT NOT NULL,
    "matchedGrievanceId" TEXT,
    "matchedTempId" TEXT,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchReason" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_grievance_duplicates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temporary_grievances_tempTicketId_key" ON "temporary_grievances"("tempTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_grievances_convertedGrievanceId_key" ON "temporary_grievances"("convertedGrievanceId");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_grievances_d2dSurveyResponseId_key" ON "temporary_grievances"("d2dSurveyResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_convertedFromTempId_key" ON "Grievance"("convertedFromTempId");

-- CreateIndex
CREATE INDEX "temporary_grievances_source_idx" ON "temporary_grievances"("source");

-- CreateIndex
CREATE INDEX "temporary_grievances_validationStatus_idx" ON "temporary_grievances"("validationStatus");

-- CreateIndex
CREATE INDEX "temporary_grievances_priority_idx" ON "temporary_grievances"("priority");

-- CreateIndex
CREATE INDEX "temporary_grievances_mandalId_idx" ON "temporary_grievances"("mandalId");

-- CreateIndex
CREATE INDEX "temporary_grievances_villageId_idx" ON "temporary_grievances"("villageId");

-- CreateIndex
CREATE INDEX "temporary_grievances_assignedValidatorId_idx" ON "temporary_grievances"("assignedValidatorId");

-- CreateIndex
CREATE INDEX "temporary_grievances_citizenId_idx" ON "temporary_grievances"("citizenId");

-- CreateIndex
CREATE INDEX "temporary_grievances_mobileNumber_idx" ON "temporary_grievances"("mobileNumber");

-- CreateIndex
CREATE INDEX "temporary_grievances_createdAt_idx" ON "temporary_grievances"("createdAt");

-- CreateIndex
CREATE INDEX "temporary_grievance_media_temporaryGrievanceId_idx" ON "temporary_grievance_media"("temporaryGrievanceId");

-- CreateIndex
CREATE INDEX "temporary_grievance_notes_temporaryGrievanceId_idx" ON "temporary_grievance_notes"("temporaryGrievanceId");

-- CreateIndex
CREATE INDEX "temporary_grievance_validation_logs_temporaryGrievanceId_idx" ON "temporary_grievance_validation_logs"("temporaryGrievanceId");

-- CreateIndex
CREATE INDEX "temporary_grievance_duplicates_temporaryGrievanceId_idx" ON "temporary_grievance_duplicates"("temporaryGrievanceId");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_convertedFromTempId_fkey" FOREIGN KEY ("convertedFromTempId") REFERENCES "temporary_grievances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_assignedValidatorId_fkey" FOREIGN KEY ("assignedValidatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_convertedGrievanceId_fkey" FOREIGN KEY ("convertedGrievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_whatsappConversationId_fkey" FOREIGN KEY ("whatsappConversationId") REFERENCES "WhatsappConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievances" ADD CONSTRAINT "temporary_grievances_d2dSurveyResponseId_fkey" FOREIGN KEY ("d2dSurveyResponseId") REFERENCES "d2d_survey_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_media" ADD CONSTRAINT "temporary_grievance_media_temporaryGrievanceId_fkey" FOREIGN KEY ("temporaryGrievanceId") REFERENCES "temporary_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_media" ADD CONSTRAINT "temporary_grievance_media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_notes" ADD CONSTRAINT "temporary_grievance_notes_temporaryGrievanceId_fkey" FOREIGN KEY ("temporaryGrievanceId") REFERENCES "temporary_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_notes" ADD CONSTRAINT "temporary_grievance_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_validation_logs" ADD CONSTRAINT "temporary_grievance_validation_logs_temporaryGrievanceId_fkey" FOREIGN KEY ("temporaryGrievanceId") REFERENCES "temporary_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_validation_logs" ADD CONSTRAINT "temporary_grievance_validation_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_grievance_duplicates" ADD CONSTRAINT "temporary_grievance_duplicates_temporaryGrievanceId_fkey" FOREIGN KEY ("temporaryGrievanceId") REFERENCES "temporary_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

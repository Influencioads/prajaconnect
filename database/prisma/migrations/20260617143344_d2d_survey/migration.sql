-- CreateEnum
CREATE TYPE "D2DSurveyType" AS ENUM ('Household', 'Voter', 'Scheme', 'Grievance', 'ElectionSentiment', 'CandidateFeedback', 'DevelopmentWorks');

-- CreateEnum
CREATE TYPE "D2DSurveyStatus" AS ENUM ('Draft', 'Active', 'Paused', 'Completed', 'Closed');

-- CreateEnum
CREATE TYPE "D2DQuestionType" AS ENUM ('Text', 'Number', 'SingleChoice', 'MultiChoice', 'YesNo', 'Rating', 'Dropdown', 'Photo', 'Location', 'Signature');

-- CreateEnum
CREATE TYPE "D2DSentiment" AS ENUM ('Supporter', 'Neutral', 'Opponent', 'Undecided');

-- CreateEnum
CREATE TYPE "D2DPriority" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "D2DSyncStatus" AS ENUM ('Pending', 'Synced', 'Failed');

-- CreateEnum
CREATE TYPE "D2DAssignmentStatus" AS ENUM ('Active', 'Paused', 'Completed');

-- CreateEnum
CREATE TYPE "D2DResponseStatus" AS ENUM ('Draft', 'Submitted', 'Synced', 'Failed');

-- CreateTable
CREATE TABLE "d2d_surveys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTe" TEXT,
    "type" "D2DSurveyType" NOT NULL DEFAULT 'Household',
    "status" "D2DSurveyStatus" NOT NULL DEFAULT 'Draft',
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetHouseholds" INTEGER NOT NULL DEFAULT 0,
    "targetMandalId" TEXT,
    "targetVillageId" TEXT,
    "targetBoothId" TEXT,
    "targetConstituencyId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_questions" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "D2DQuestionType" NOT NULL DEFAULT 'Text',
    "label" TEXT NOT NULL,
    "labelTe" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "labelTe" TEXT,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d2d_survey_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_assignments" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT,
    "cadreId" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "street" TEXT,
    "dailyTarget" INTEGER NOT NULL DEFAULT 10,
    "status" "D2DAssignmentStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_survey_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_households" (
    "id" TEXT NOT NULL,
    "houseNumber" TEXT,
    "headName" TEXT NOT NULL,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "ward" TEXT,
    "street" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "familyId" TEXT,
    "citizenId" TEXT,
    "surveyedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_family_members" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender",
    "voterId" TEXT,
    "mobile" TEXT,
    "occupation" TEXT,
    "education" TEXT,
    "votingPreference" "D2DSentiment",
    "schemeBenefits" JSONB,
    "issues" JSONB,
    "citizenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "householdId" TEXT,
    "surveyorUserId" TEXT,
    "surveyorCadreId" TEXT,
    "sentiment" "D2DSentiment",
    "priority" "D2DPriority",
    "needsFollowup" BOOLEAN NOT NULL DEFAULT false,
    "isKeyVoter" BOOLEAN NOT NULL DEFAULT false,
    "influencer" BOOLEAN NOT NULL DEFAULT false,
    "issues" JSONB,
    "timeTakenSec" INTEGER,
    "status" "D2DResponseStatus" NOT NULL DEFAULT 'Submitted',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "grievanceId" TEXT,
    "activityId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_response_answers" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d2d_response_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_photos" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d2d_survey_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_locations" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d2d_survey_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_volunteer_targets" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT,
    "cadreId" TEXT,
    "date" DATE NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 10,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_volunteer_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_sync_queue" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "D2DSyncStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_followups" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Task',
    "note" TEXT,
    "dueAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d2d_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d2d_survey_reports" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "params" JSONB,
    "summary" JSONB,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d2d_survey_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d2d_surveys_status_idx" ON "d2d_surveys"("status");

-- CreateIndex
CREATE INDEX "d2d_surveys_type_idx" ON "d2d_surveys"("type");

-- CreateIndex
CREATE INDEX "d2d_surveys_targetMandalId_idx" ON "d2d_surveys"("targetMandalId");

-- CreateIndex
CREATE INDEX "d2d_surveys_targetVillageId_idx" ON "d2d_surveys"("targetVillageId");

-- CreateIndex
CREATE INDEX "d2d_surveys_targetBoothId_idx" ON "d2d_surveys"("targetBoothId");

-- CreateIndex
CREATE INDEX "d2d_survey_questions_surveyId_idx" ON "d2d_survey_questions"("surveyId");

-- CreateIndex
CREATE INDEX "d2d_survey_options_questionId_idx" ON "d2d_survey_options"("questionId");

-- CreateIndex
CREATE INDEX "d2d_survey_assignments_surveyId_idx" ON "d2d_survey_assignments"("surveyId");

-- CreateIndex
CREATE INDEX "d2d_survey_assignments_userId_idx" ON "d2d_survey_assignments"("userId");

-- CreateIndex
CREATE INDEX "d2d_survey_assignments_cadreId_idx" ON "d2d_survey_assignments"("cadreId");

-- CreateIndex
CREATE INDEX "d2d_households_villageId_idx" ON "d2d_households"("villageId");

-- CreateIndex
CREATE INDEX "d2d_households_boothId_idx" ON "d2d_households"("boothId");

-- CreateIndex
CREATE INDEX "d2d_households_mandalId_idx" ON "d2d_households"("mandalId");

-- CreateIndex
CREATE INDEX "d2d_family_members_householdId_idx" ON "d2d_family_members"("householdId");

-- CreateIndex
CREATE INDEX "d2d_family_members_citizenId_idx" ON "d2d_family_members"("citizenId");

-- CreateIndex
CREATE INDEX "d2d_survey_responses_surveyId_idx" ON "d2d_survey_responses"("surveyId");

-- CreateIndex
CREATE INDEX "d2d_survey_responses_householdId_idx" ON "d2d_survey_responses"("householdId");

-- CreateIndex
CREATE INDEX "d2d_survey_responses_surveyorUserId_idx" ON "d2d_survey_responses"("surveyorUserId");

-- CreateIndex
CREATE INDEX "d2d_survey_responses_status_idx" ON "d2d_survey_responses"("status");

-- CreateIndex
CREATE INDEX "d2d_survey_responses_sentiment_idx" ON "d2d_survey_responses"("sentiment");

-- CreateIndex
CREATE INDEX "d2d_response_answers_responseId_idx" ON "d2d_response_answers"("responseId");

-- CreateIndex
CREATE INDEX "d2d_response_answers_questionId_idx" ON "d2d_response_answers"("questionId");

-- CreateIndex
CREATE INDEX "d2d_survey_photos_responseId_idx" ON "d2d_survey_photos"("responseId");

-- CreateIndex
CREATE INDEX "d2d_survey_locations_responseId_idx" ON "d2d_survey_locations"("responseId");

-- CreateIndex
CREATE INDEX "d2d_volunteer_targets_surveyId_idx" ON "d2d_volunteer_targets"("surveyId");

-- CreateIndex
CREATE INDEX "d2d_volunteer_targets_userId_idx" ON "d2d_volunteer_targets"("userId");

-- CreateIndex
CREATE INDEX "d2d_volunteer_targets_date_idx" ON "d2d_volunteer_targets"("date");

-- CreateIndex
CREATE UNIQUE INDEX "d2d_sync_queue_clientId_key" ON "d2d_sync_queue"("clientId");

-- CreateIndex
CREATE INDEX "d2d_sync_queue_deviceId_idx" ON "d2d_sync_queue"("deviceId");

-- CreateIndex
CREATE INDEX "d2d_sync_queue_status_idx" ON "d2d_sync_queue"("status");

-- CreateIndex
CREATE INDEX "d2d_followups_responseId_idx" ON "d2d_followups"("responseId");

-- CreateIndex
CREATE INDEX "d2d_followups_assignedToUserId_idx" ON "d2d_followups"("assignedToUserId");

-- CreateIndex
CREATE INDEX "d2d_survey_reports_type_idx" ON "d2d_survey_reports"("type");

-- CreateIndex
CREATE INDEX "d2d_survey_reports_surveyId_idx" ON "d2d_survey_reports"("surveyId");

-- AddForeignKey
ALTER TABLE "d2d_surveys" ADD CONSTRAINT "d2d_surveys_targetMandalId_fkey" FOREIGN KEY ("targetMandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_surveys" ADD CONSTRAINT "d2d_surveys_targetVillageId_fkey" FOREIGN KEY ("targetVillageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_surveys" ADD CONSTRAINT "d2d_surveys_targetBoothId_fkey" FOREIGN KEY ("targetBoothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_surveys" ADD CONSTRAINT "d2d_surveys_targetConstituencyId_fkey" FOREIGN KEY ("targetConstituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_surveys" ADD CONSTRAINT "d2d_surveys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_questions" ADD CONSTRAINT "d2d_survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "d2d_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_options" ADD CONSTRAINT "d2d_survey_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "d2d_survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_assignments" ADD CONSTRAINT "d2d_survey_assignments_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "d2d_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_assignments" ADD CONSTRAINT "d2d_survey_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_assignments" ADD CONSTRAINT "d2d_survey_assignments_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_households" ADD CONSTRAINT "d2d_households_surveyedById_fkey" FOREIGN KEY ("surveyedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_family_members" ADD CONSTRAINT "d2d_family_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "d2d_households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_family_members" ADD CONSTRAINT "d2d_family_members_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "d2d_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "d2d_households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_surveyorUserId_fkey" FOREIGN KEY ("surveyorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_surveyorCadreId_fkey" FOREIGN KEY ("surveyorCadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_responses" ADD CONSTRAINT "d2d_survey_responses_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_response_answers" ADD CONSTRAINT "d2d_response_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "d2d_survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_response_answers" ADD CONSTRAINT "d2d_response_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "d2d_survey_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_photos" ADD CONSTRAINT "d2d_survey_photos_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "d2d_survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_locations" ADD CONSTRAINT "d2d_survey_locations_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "d2d_survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_volunteer_targets" ADD CONSTRAINT "d2d_volunteer_targets_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "d2d_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_volunteer_targets" ADD CONSTRAINT "d2d_volunteer_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_volunteer_targets" ADD CONSTRAINT "d2d_volunteer_targets_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_followups" ADD CONSTRAINT "d2d_followups_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "d2d_survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_followups" ADD CONSTRAINT "d2d_followups_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_followups" ADD CONSTRAINT "d2d_followups_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d2d_survey_reports" ADD CONSTRAINT "d2d_survey_reports_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "d2d_surveys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

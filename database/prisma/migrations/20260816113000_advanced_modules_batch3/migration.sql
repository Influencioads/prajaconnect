-- AlterTable
ALTER TABLE "AppointmentRequest" ADD COLUMN     "details" JSONB,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'office';

-- AlterTable
ALTER TABLE "Cadre" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "anniversaryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NewsSource" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'rss';

-- AlterTable
ALTER TABLE "VipContact" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "committee_members" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "imp_leaders" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "influencers" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "press_contacts" ADD COLUMN     "anniversaryDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBulletin" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "edition" TEXT NOT NULL DEFAULT 'daily',
    "narrative" TEXT,
    "narrativeTe" TEXT,
    "sections" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ready',
    "deliveryResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBulletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulletinSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "mandalId" TEXT,
    "channels" JSONB,
    "sendAtHour" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulletinSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreetingTemplate" (
    "id" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GreetingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreetingQueueItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "occasion" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "mobile" TEXT,
    "message" TEXT NOT NULL,
    "messageTe" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "sentVia" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreetingQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CondolenceLog" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CondolenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "language" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyTe" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "addresseeName" TEXT NOT NULL,
    "addresseeDesignation" TEXT,
    "departmentId" TEXT,
    "officialId" TEXT,
    "citizenId" TEXT,
    "grievanceId" TEXT,
    "pdfUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeMatch" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "matchedOn" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Suggested',
    "assignedCadreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemeMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCamp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'General',
    "villageId" TEXT,
    "mandalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "targetSchemes" JSONB NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rss',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "url" TEXT,
    "contentHash" TEXT NOT NULL,
    "summary" TEXT,
    "qualification" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "lastDate" TIMESTAMP(3),
    "district" TEXT,
    "aiExtracted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDispatchLog" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "citizenCount" INTEGER NOT NULL,
    "channels" JSONB NOT NULL,
    "dispatchedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDispatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RivalLeader" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RivalLeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RivalMention" (
    "id" TEXT NOT NULL,
    "rivalId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RivalMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "approvedBy" TEXT,
    "postedAt" TIMESTAMP(3),
    "externalUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMention" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "sentiment" TEXT,
    "severity" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "SocialMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTriageLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTriageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampRegistration" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'PreRegistered',
    "token" INTEGER NOT NULL,
    "purpose" TEXT,
    "outcome" TEXT,
    "resolvedOnSpot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSession" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaWarning" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "notifiedUserIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsDailySnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inactiveCadre" JSONB NOT NULL,
    "darkZones" JSONB NOT NULL,
    "slaAtRisk" INTEGER NOT NULL,
    "slaBreached" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsDailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MPLADS',
    "financialYear" TEXT NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundWork" (
    "id" TEXT NOT NULL,
    "fundSourceId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "villageId" TEXT,
    "mandalId" TEXT,
    "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'Recommended',
    "recommendedAt" TIMESTAMP(3),
    "sanctionedAt" TIMESTAMP(3),
    "sanctionNo" TEXT,
    "releasedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ucSubmittedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundInstallment" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkProgressUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "percentComplete" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "citizenId" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "cardPhotoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "decision" TEXT NOT NULL DEFAULT 'Pending',
    "representativeId" TEXT,
    "giftNotes" TEXT,
    "wishSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "D2DInsight" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "themes" JSONB NOT NULL,
    "emergingIssues" JSONB NOT NULL,
    "sentimentShift" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "D2DInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenBrief" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "briefTe" TEXT,
    "sources" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluenceLink" (
    "id" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "boothId" TEXT,
    "villageId" TEXT,
    "community" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 3,
    "relation" TEXT NOT NULL DEFAULT 'Supports',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OppositionActivity" (
    "id" TEXT NOT NULL,
    "rivalName" TEXT NOT NULL,
    "party" TEXT,
    "activityType" TEXT NOT NULL,
    "villageId" TEXT,
    "mandalId" TEXT,
    "boothId" TEXT,
    "description" TEXT NOT NULL,
    "headcount" INTEGER,
    "photoUrl" TEXT,
    "reportedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OppositionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandalScorecard" (
    "id" TEXT NOT NULL,
    "mandalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "grievanceResolutionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slaBreaches" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d2dCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "openCrises" INTEGER NOT NULL DEFAULT 0,
    "composite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MandalScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadreScoreDaily" (
    "id" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIns" INTEGER NOT NULL DEFAULT 0,
    "d2dVisits" INTEGER NOT NULL DEFAULT 0,
    "activities" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadreScoreDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "citizenId" TEXT,
    "applicantName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "villageId" TEXT,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Received',
    "slaDueAt" TIMESTAMP(3),
    "outcome" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestUpdate" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequestUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DailyBulletin_edition_idx" ON "DailyBulletin"("edition");

-- CreateIndex
CREATE INDEX "DailyBulletin_date_idx" ON "DailyBulletin"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBulletin_date_edition_key" ON "DailyBulletin"("date", "edition");

-- CreateIndex
CREATE UNIQUE INDEX "BulletinSubscription_userId_key" ON "BulletinSubscription"("userId");

-- CreateIndex
CREATE INDEX "BulletinSubscription_active_idx" ON "BulletinSubscription"("active");

-- CreateIndex
CREATE INDEX "GreetingTemplate_occasion_language_active_idx" ON "GreetingTemplate"("occasion", "language", "active");

-- CreateIndex
CREATE INDEX "GreetingQueueItem_date_idx" ON "GreetingQueueItem"("date");

-- CreateIndex
CREATE INDEX "GreetingQueueItem_status_idx" ON "GreetingQueueItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GreetingQueueItem_date_occasion_targetType_targetId_key" ON "GreetingQueueItem"("date", "occasion", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CondolenceLog_citizenId_idx" ON "CondolenceLog"("citizenId");

-- CreateIndex
CREATE INDEX "CondolenceLog_date_idx" ON "CondolenceLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Letter_refNo_key" ON "Letter"("refNo");

-- CreateIndex
CREATE INDEX "Letter_status_idx" ON "Letter"("status");

-- CreateIndex
CREATE INDEX "Letter_type_idx" ON "Letter"("type");

-- CreateIndex
CREATE INDEX "Letter_createdById_idx" ON "Letter"("createdById");

-- CreateIndex
CREATE INDEX "Letter_grievanceId_idx" ON "Letter"("grievanceId");

-- CreateIndex
CREATE INDEX "Letter_citizenId_idx" ON "Letter"("citizenId");

-- CreateIndex
CREATE INDEX "SchemeMatch_citizenId_idx" ON "SchemeMatch"("citizenId");

-- CreateIndex
CREATE INDEX "SchemeMatch_status_idx" ON "SchemeMatch"("status");

-- CreateIndex
CREATE INDEX "SchemeMatch_assignedCadreId_idx" ON "SchemeMatch"("assignedCadreId");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeMatch_schemeId_citizenId_key" ON "SchemeMatch"("schemeId", "citizenId");

-- CreateIndex
CREATE INDEX "ServiceCamp_date_idx" ON "ServiceCamp"("date");

-- CreateIndex
CREATE INDEX "ServiceCamp_status_idx" ON "ServiceCamp"("status");

-- CreateIndex
CREATE INDEX "ServiceCamp_mandalId_idx" ON "ServiceCamp"("mandalId");

-- CreateIndex
CREATE INDEX "ServiceCamp_villageId_idx" ON "ServiceCamp"("villageId");

-- CreateIndex
CREATE UNIQUE INDEX "JobSource_url_key" ON "JobSource"("url");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_contentHash_key" ON "JobPosting"("contentHash");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_lastDate_idx" ON "JobPosting"("lastDate");

-- CreateIndex
CREATE INDEX "JobPosting_sourceId_idx" ON "JobPosting"("sourceId");

-- CreateIndex
CREATE INDEX "JobDispatchLog_postingId_idx" ON "JobDispatchLog"("postingId");

-- CreateIndex
CREATE INDEX "RivalMention_rivalId_idx" ON "RivalMention"("rivalId");

-- CreateIndex
CREATE INDEX "RivalMention_articleId_idx" ON "RivalMention"("articleId");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialMention_platform_idx" ON "SocialMention"("platform");

-- CreateIndex
CREATE INDEX "SocialMention_fetchedAt_idx" ON "SocialMention"("fetchedAt");

-- CreateIndex
CREATE INDEX "AiTriageLog_entityType_entityId_idx" ON "AiTriageLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AiTriageLog_kind_idx" ON "AiTriageLog"("kind");

-- CreateIndex
CREATE INDEX "CampRegistration_campId_idx" ON "CampRegistration"("campId");

-- CreateIndex
CREATE INDEX "CampRegistration_citizenId_idx" ON "CampRegistration"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "CampRegistration_campId_citizenId_key" ON "CampRegistration"("campId", "citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "BotSession_conversationId_key" ON "BotSession"("conversationId");

-- CreateIndex
CREATE INDEX "SlaWarning_grievanceId_idx" ON "SlaWarning"("grievanceId");

-- CreateIndex
CREATE INDEX "SlaWarning_kind_idx" ON "SlaWarning"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "OpsDailySnapshot_date_key" ON "OpsDailySnapshot"("date");

-- CreateIndex
CREATE INDEX "FundSource_active_idx" ON "FundSource"("active");

-- CreateIndex
CREATE INDEX "FundWork_fundSourceId_idx" ON "FundWork"("fundSourceId");

-- CreateIndex
CREATE INDEX "FundWork_stage_idx" ON "FundWork"("stage");

-- CreateIndex
CREATE INDEX "FundWork_mandalId_idx" ON "FundWork"("mandalId");

-- CreateIndex
CREATE INDEX "FundInstallment_workId_idx" ON "FundInstallment"("workId");

-- CreateIndex
CREATE INDEX "WorkProgressUpdate_projectId_idx" ON "WorkProgressUpdate"("projectId");

-- CreateIndex
CREATE INDEX "WorkProgressUpdate_createdAt_idx" ON "WorkProgressUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "Invitation_decision_idx" ON "Invitation"("decision");

-- CreateIndex
CREATE INDEX "Invitation_eventDate_idx" ON "Invitation"("eventDate");

-- CreateIndex
CREATE INDEX "Invitation_category_idx" ON "Invitation"("category");

-- CreateIndex
CREATE INDEX "D2DInsight_scope_createdAt_idx" ON "D2DInsight"("scope", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenBrief_citizenId_key" ON "CitizenBrief"("citizenId");

-- CreateIndex
CREATE INDEX "InfluenceLink_boothId_idx" ON "InfluenceLink"("boothId");

-- CreateIndex
CREATE INDEX "InfluenceLink_villageId_idx" ON "InfluenceLink"("villageId");

-- CreateIndex
CREATE INDEX "InfluenceLink_personType_personId_idx" ON "InfluenceLink"("personType", "personId");

-- CreateIndex
CREATE INDEX "InfluenceLink_relation_idx" ON "InfluenceLink"("relation");

-- CreateIndex
CREATE INDEX "OppositionActivity_mandalId_idx" ON "OppositionActivity"("mandalId");

-- CreateIndex
CREATE INDEX "OppositionActivity_villageId_idx" ON "OppositionActivity"("villageId");

-- CreateIndex
CREATE INDEX "OppositionActivity_boothId_idx" ON "OppositionActivity"("boothId");

-- CreateIndex
CREATE INDEX "OppositionActivity_occurredAt_idx" ON "OppositionActivity"("occurredAt");

-- CreateIndex
CREATE INDEX "OppositionActivity_activityType_idx" ON "OppositionActivity"("activityType");

-- CreateIndex
CREATE INDEX "MandalScorecard_date_idx" ON "MandalScorecard"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MandalScorecard_mandalId_date_key" ON "MandalScorecard"("mandalId", "date");

-- CreateIndex
CREATE INDEX "CadreScoreDaily_date_idx" ON "CadreScoreDaily"("date");

-- CreateIndex
CREATE INDEX "CadreScoreDaily_points_idx" ON "CadreScoreDaily"("points");

-- CreateIndex
CREATE UNIQUE INDEX "CadreScoreDaily_cadreId_date_key" ON "CadreScoreDaily"("cadreId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_refNo_key" ON "ServiceRequest"("refNo");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_type_idx" ON "ServiceRequest"("type");

-- CreateIndex
CREATE INDEX "ServiceRequest_villageId_idx" ON "ServiceRequest"("villageId");

-- CreateIndex
CREATE INDEX "ServiceRequest_departmentId_idx" ON "ServiceRequest"("departmentId");

-- CreateIndex
CREATE INDEX "ServiceRequestUpdate_requestId_idx" ON "ServiceRequestUpdate"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_registrationId_key" ON "VolunteerProfile"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");

-- CreateIndex
CREATE INDEX "VolunteerProfile_active_idx" ON "VolunteerProfile"("active");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulletinSubscription" ADD CONSTRAINT "BulletinSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondolenceLog" ADD CONSTRAINT "CondolenceLog_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "GovernmentOfficial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeMatch" ADD CONSTRAINT "SchemeMatch_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeMatch" ADD CONSTRAINT "SchemeMatch_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeMatch" ADD CONSTRAINT "SchemeMatch_assignedCadreId_fkey" FOREIGN KEY ("assignedCadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCamp" ADD CONSTRAINT "ServiceCamp_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCamp" ADD CONSTRAINT "ServiceCamp_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "JobSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDispatchLog" ADD CONSTRAINT "JobDispatchLog_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RivalMention" ADD CONSTRAINT "RivalMention_rivalId_fkey" FOREIGN KEY ("rivalId") REFERENCES "RivalLeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RivalMention" ADD CONSTRAINT "RivalMention_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampRegistration" ADD CONSTRAINT "CampRegistration_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ServiceCamp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampRegistration" ADD CONSTRAINT "CampRegistration_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotSession" ADD CONSTRAINT "BotSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaWarning" ADD CONSTRAINT "SlaWarning_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundWork" ADD CONSTRAINT "FundWork_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "FundSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundWork" ADD CONSTRAINT "FundWork_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundWork" ADD CONSTRAINT "FundWork_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundWork" ADD CONSTRAINT "FundWork_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundInstallment" ADD CONSTRAINT "FundInstallment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "FundWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProgressUpdate" ADD CONSTRAINT "WorkProgressUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkProgressUpdate" ADD CONSTRAINT "WorkProgressUpdate_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenBrief" ADD CONSTRAINT "CitizenBrief_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceLink" ADD CONSTRAINT "InfluenceLink_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluenceLink" ADD CONSTRAINT "InfluenceLink_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OppositionActivity" ADD CONSTRAINT "OppositionActivity_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OppositionActivity" ADD CONSTRAINT "OppositionActivity_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OppositionActivity" ADD CONSTRAINT "OppositionActivity_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OppositionActivity" ADD CONSTRAINT "OppositionActivity_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandalScorecard" ADD CONSTRAINT "MandalScorecard_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadreScoreDaily" ADD CONSTRAINT "CadreScoreDaily_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestUpdate" ADD CONSTRAINT "ServiceRequestUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "VolunteerRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


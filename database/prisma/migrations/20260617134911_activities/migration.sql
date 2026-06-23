-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('Call', 'CampaignCall', 'ConferenceCall', 'WhatsApp', 'Email', 'Meeting', 'Visit', 'Task', 'VolunteerActivity', 'CadreActivity', 'GrievanceFollowup', 'EventActivity', 'SurveyActivity', 'SocialMedia', 'PressInteraction', 'InfluencerInteraction', 'OfficialMeeting', 'FieldVisit', 'DoorToDoor', 'BoothActivity', 'SmsCampaign', 'VoiceBroadcast');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('Planned', 'Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoResponse', 'FollowUp');

-- CreateEnum
CREATE TYPE "ActivityDirection" AS ENUM ('Inbound', 'Outbound', 'Missed');

-- CreateEnum
CREATE TYPE "ActivityPriority" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('CampaignCall', 'SmsCampaign', 'VoiceBroadcast', 'EmailCampaign', 'DoorToDoor', 'FieldOutreach');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('Draft', 'Active', 'Paused', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('Invited', 'Confirmed', 'Attended', 'Absent', 'Declined');

-- CreateEnum
CREATE TYPE "CommitteeCategory" AS ENUM ('MandalCommittee', 'VillageCommittee', 'CoordinationCommittee', 'MandalCoordinationCommittee');

-- CreateEnum
CREATE TYPE "NetworkStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "NetworkEntityType" AS ENUM ('CommitteeMember', 'Observer', 'ImpLeader', 'Influencer', 'Press');

-- CreateEnum
CREATE TYPE "JournalistType" AS ENUM ('Print', 'TV', 'Digital', 'YouTube');

-- CreateTable
CREATE TABLE "ActivityCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'CampaignCall',
    "status" "CampaignStatus" NOT NULL DEFAULT 'Draft',
    "description" TEXT,
    "script" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "reachedCount" INTEGER NOT NULL DEFAULT 0,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "constituencyId" TEXT,
    "mandalId" TEXT,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "type" "ActivityType" NOT NULL,
    "subType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'Planned',
    "priority" "ActivityPriority" NOT NULL DEFAULT 'Medium',
    "direction" "ActivityDirection",
    "outcome" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "mediaUrls" JSONB,
    "metadata" JSONB,
    "contactName" TEXT,
    "contactMobile" TEXT,
    "locationName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "campaignId" TEXT,
    "citizenId" TEXT,
    "cadreId" TEXT,
    "officialId" TEXT,
    "eventId" TEXT,
    "grievanceId" TEXT,
    "surveyId" TEXT,
    "assignedToUserId" TEXT,
    "createdById" TEXT,
    "villageId" TEXT,
    "mandalId" TEXT,
    "constituencyId" TEXT,
    "boothId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipant" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "name" TEXT,
    "mobile" TEXT,
    "role" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'Invited',
    "citizenId" TEXT,
    "cadreId" TEXT,
    "userId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityNote" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'Note',
    "fromStatus" "ActivityStatus",
    "toStatus" "ActivityStatus",
    "note" TEXT,
    "byUserId" TEXT,
    "byName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReminder" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "forUserId" TEXT,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "params" JSONB,
    "summary" JSONB,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CommitteeCategory" NOT NULL,
    "description" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "designation" TEXT,
    "categoryType" TEXT,
    "wardNumber" TEXT,
    "boothNumber" TEXT,
    "address" TEXT,
    "politicalInfluenceLevel" TEXT,
    "publicReach" INTEGER,
    "assignedArea" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "category" "CommitteeCategory" NOT NULL DEFAULT 'MandalCommittee',
    "committeeId" TEXT,
    "committeeName" TEXT,
    "committeeRole" TEXT,
    "partyPosition" TEXT,
    "joiningDate" TIMESTAMP(3),
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "taskCompletionScore" INTEGER NOT NULL DEFAULT 0,
    "volunteerStrength" INTEGER NOT NULL DEFAULT 0,
    "boothResponsibility" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "reportingPersonId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "designation" TEXT,
    "categoryType" TEXT,
    "wardNumber" TEXT,
    "boothNumber" TEXT,
    "address" TEXT,
    "politicalInfluenceLevel" TEXT,
    "publicReach" INTEGER,
    "assignedArea" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "observationArea" TEXT,
    "assignedMandals" TEXT,
    "reportingFrequency" TEXT,
    "performanceRemarks" TEXT,
    "issueEscalationCount" INTEGER NOT NULL DEFAULT 0,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "reportingPersonId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imp_leaders" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "designation" TEXT,
    "categoryType" TEXT,
    "wardNumber" TEXT,
    "boothNumber" TEXT,
    "address" TEXT,
    "politicalInfluenceLevel" TEXT,
    "publicReach" INTEGER,
    "assignedArea" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "influenceArea" TEXT,
    "communityReach" INTEGER,
    "voterInfluenceScore" INTEGER,
    "keySupportGroups" TEXT,
    "priorityLevel" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "reportingPersonId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imp_leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "designation" TEXT,
    "categoryType" TEXT,
    "wardNumber" TEXT,
    "boothNumber" TEXT,
    "address" TEXT,
    "politicalInfluenceLevel" TEXT,
    "publicReach" INTEGER,
    "assignedArea" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "platform" TEXT,
    "instagramFollowers" INTEGER,
    "facebookFollowers" INTEGER,
    "youtubeSubscribers" INTEGER,
    "twitterFollowers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "contentCategory" TEXT,
    "politicalAlignment" TEXT,
    "collaborationStatus" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "reportingPersonId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_contacts" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "designation" TEXT,
    "categoryType" TEXT,
    "wardNumber" TEXT,
    "boothNumber" TEXT,
    "address" TEXT,
    "politicalInfluenceLevel" TEXT,
    "publicReach" INTEGER,
    "assignedArea" TEXT,
    "status" "NetworkStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "mediaHouseName" TEXT,
    "journalistType" "JournalistType",
    "beat" TEXT,
    "districtCoverage" TEXT,
    "mandalCoverage" TEXT,
    "pressId" TEXT,
    "relationshipStatus" TEXT,
    "lastInteractionDate" TIMESTAMP(3),
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "reportingPersonId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_activity_logs" (
    "id" TEXT NOT NULL,
    "entityType" "NetworkEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "byUserId" TEXT,
    "byName" TEXT,
    "eventId" TEXT,
    "grievanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityCampaign_type_idx" ON "ActivityCampaign"("type");

-- CreateIndex
CREATE INDEX "ActivityCampaign_status_idx" ON "ActivityCampaign"("status");

-- CreateIndex
CREATE INDEX "ActivityCampaign_constituencyId_idx" ON "ActivityCampaign"("constituencyId");

-- CreateIndex
CREATE INDEX "ActivityCampaign_mandalId_idx" ON "ActivityCampaign"("mandalId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_priority_idx" ON "Activity"("priority");

-- CreateIndex
CREATE INDEX "Activity_dueAt_idx" ON "Activity"("dueAt");

-- CreateIndex
CREATE INDEX "Activity_scheduledAt_idx" ON "Activity"("scheduledAt");

-- CreateIndex
CREATE INDEX "Activity_assignedToUserId_idx" ON "Activity"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Activity_citizenId_idx" ON "Activity"("citizenId");

-- CreateIndex
CREATE INDEX "Activity_cadreId_idx" ON "Activity"("cadreId");

-- CreateIndex
CREATE INDEX "Activity_campaignId_idx" ON "Activity"("campaignId");

-- CreateIndex
CREATE INDEX "Activity_grievanceId_idx" ON "Activity"("grievanceId");

-- CreateIndex
CREATE INDEX "Activity_mandalId_idx" ON "Activity"("mandalId");

-- CreateIndex
CREATE INDEX "Activity_constituencyId_idx" ON "Activity"("constituencyId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityParticipant_activityId_idx" ON "ActivityParticipant"("activityId");

-- CreateIndex
CREATE INDEX "ActivityParticipant_citizenId_idx" ON "ActivityParticipant"("citizenId");

-- CreateIndex
CREATE INDEX "ActivityParticipant_cadreId_idx" ON "ActivityParticipant"("cadreId");

-- CreateIndex
CREATE INDEX "ActivityNote_activityId_idx" ON "ActivityNote"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReminder_activityId_idx" ON "ActivityReminder"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReminder_remindAt_idx" ON "ActivityReminder"("remindAt");

-- CreateIndex
CREATE INDEX "ActivityReminder_sent_idx" ON "ActivityReminder"("sent");

-- CreateIndex
CREATE INDEX "ActivityReport_type_idx" ON "ActivityReport"("type");

-- CreateIndex
CREATE INDEX "ActivityReport_createdAt_idx" ON "ActivityReport"("createdAt");

-- CreateIndex
CREATE INDEX "committees_category_idx" ON "committees"("category");

-- CreateIndex
CREATE INDEX "committees_status_idx" ON "committees"("status");

-- CreateIndex
CREATE INDEX "committees_mandalId_idx" ON "committees"("mandalId");

-- CreateIndex
CREATE INDEX "committee_members_category_idx" ON "committee_members"("category");

-- CreateIndex
CREATE INDEX "committee_members_status_idx" ON "committee_members"("status");

-- CreateIndex
CREATE INDEX "committee_members_mandalId_idx" ON "committee_members"("mandalId");

-- CreateIndex
CREATE INDEX "committee_members_villageId_idx" ON "committee_members"("villageId");

-- CreateIndex
CREATE INDEX "committee_members_committeeId_idx" ON "committee_members"("committeeId");

-- CreateIndex
CREATE INDEX "observers_status_idx" ON "observers"("status");

-- CreateIndex
CREATE INDEX "observers_mandalId_idx" ON "observers"("mandalId");

-- CreateIndex
CREATE INDEX "imp_leaders_status_idx" ON "imp_leaders"("status");

-- CreateIndex
CREATE INDEX "imp_leaders_mandalId_idx" ON "imp_leaders"("mandalId");

-- CreateIndex
CREATE INDEX "imp_leaders_priorityLevel_idx" ON "imp_leaders"("priorityLevel");

-- CreateIndex
CREATE INDEX "influencers_status_idx" ON "influencers"("status");

-- CreateIndex
CREATE INDEX "influencers_mandalId_idx" ON "influencers"("mandalId");

-- CreateIndex
CREATE INDEX "influencers_platform_idx" ON "influencers"("platform");

-- CreateIndex
CREATE INDEX "press_contacts_status_idx" ON "press_contacts"("status");

-- CreateIndex
CREATE INDEX "press_contacts_mandalId_idx" ON "press_contacts"("mandalId");

-- CreateIndex
CREATE INDEX "press_contacts_journalistType_idx" ON "press_contacts"("journalistType");

-- CreateIndex
CREATE INDEX "committee_activity_logs_entityType_entityId_idx" ON "committee_activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "committee_activity_logs_createdAt_idx" ON "committee_activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "ActivityCampaign" ADD CONSTRAINT "ActivityCampaign_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCampaign" ADD CONSTRAINT "ActivityCampaign_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ActivityCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "GovernmentOfficial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityNote" ADD CONSTRAINT "ActivityNote_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReminder" ADD CONSTRAINT "ActivityReminder_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReminder" ADD CONSTRAINT "ActivityReminder_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observers" ADD CONSTRAINT "observers_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observers" ADD CONSTRAINT "observers_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observers" ADD CONSTRAINT "observers_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observers" ADD CONSTRAINT "observers_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observers" ADD CONSTRAINT "observers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imp_leaders" ADD CONSTRAINT "imp_leaders_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imp_leaders" ADD CONSTRAINT "imp_leaders_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imp_leaders" ADD CONSTRAINT "imp_leaders_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imp_leaders" ADD CONSTRAINT "imp_leaders_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imp_leaders" ADD CONSTRAINT "imp_leaders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_contacts" ADD CONSTRAINT "press_contacts_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_contacts" ADD CONSTRAINT "press_contacts_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_contacts" ADD CONSTRAINT "press_contacts_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_contacts" ADD CONSTRAINT "press_contacts_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_contacts" ADD CONSTRAINT "press_contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_activity_logs" ADD CONSTRAINT "committee_activity_logs_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_activity_logs" ADD CONSTRAINT "committee_activity_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_activity_logs" ADD CONSTRAINT "committee_activity_logs_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

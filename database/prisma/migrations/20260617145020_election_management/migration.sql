-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('Planning', 'Active', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ElectionExpenseStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('Cash', 'UPI', 'Bank', 'Cheque', 'Other');

-- CreateEnum
CREATE TYPE "CampaignWorkType" AS ENUM ('BannerInstallation', 'WallPainting', 'PamphletDistribution', 'DoorToDoorCampaign', 'VoterSlipDistribution', 'PublicMeetingSetup', 'StageWork', 'SoundSystemSetup', 'VehicleCampaign', 'SocialMediaContent', 'PressNote', 'VolunteerMobilization', 'BoothCommitteeWork', 'PollingAgentAssignment');

-- CreateEnum
CREATE TYPE "CampaignWorkStatus" AS ENUM ('NotStarted', 'InProgress', 'Completed', 'Delayed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ElectionVehicleType" AS ENUM ('Car', 'Jeep', 'Auto', 'Bike', 'Van', 'Bus', 'CampaignVehicle', 'SoundVehicle', 'MediaVehicle', 'LogisticsVehicle');

-- CreateEnum
CREATE TYPE "ElectionVehicleStatus" AS ENUM ('Available', 'Assigned', 'InTransit', 'Maintenance', 'Inactive');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('DoorToDoor', 'Call', 'WhatsApp', 'SMS', 'PublicMeeting', 'Other');

-- CreateEnum
CREATE TYPE "VoterStance" AS ENUM ('Supporter', 'Neutral', 'Opponent', 'Unknown');

-- CreateEnum
CREATE TYPE "CampaignTeamType" AS ENUM ('Mandal', 'Village', 'Booth', 'Media', 'SocialMedia', 'Ground', 'Transport', 'Event', 'Finance');

-- CreateEnum
CREATE TYPE "ElectionMaterialType" AS ENUM ('Pamphlets', 'Posters', 'FlexBanners', 'Flags', 'Caps', 'TShirts', 'Stickers', 'VoterSlips', 'IDCards', 'StageMaterial', 'SoundEquipment', 'Chairs', 'WaterBottles', 'FoodPackets');

-- CreateEnum
CREATE TYPE "BoothStrength" AS ENUM ('Strong', 'Weak', 'Swing');

-- CreateEnum
CREATE TYPE "PollingDayStatus" AS ENUM ('BoothOpened', 'AgentReached', 'VotingStarted', 'LowTurnoutAlert', 'IssueReported', 'Resolved', 'PollingClosed', 'FinalReportSubmitted');

-- CreateEnum
CREATE TYPE "ElectionReportType" AS ENUM ('Expense', 'Booth', 'Vehicle', 'CampaignWork', 'TeamPerformance', 'MaterialDistribution', 'VoterOutreach', 'PollingDay', 'MandalWise', 'VillageWise', 'DailySummary');

-- CreateEnum
CREATE TYPE "ElectionApprovalAction" AS ENUM ('Approved', 'Rejected', 'Pending');

-- CreateEnum
CREATE TYPE "ElectionWorkPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- DropForeignKey
ALTER TABLE "temporary_grievances" DROP CONSTRAINT "temporary_grievances_convertedGrievanceId_fkey";

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Assembly',
    "electionDate" TIMESTAMP(3),
    "status" "ElectionStatus" NOT NULL DEFAULT 'Planning',
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "constituencyId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionExpense" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorName" TEXT,
    "paidBy" TEXT,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
    "status" "ElectionExpenseStatus" NOT NULL DEFAULT 'Pending',
    "receiptUrl" TEXT,
    "billUrl" TEXT,
    "notes" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "eventId" TEXT,
    "activityId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" "ElectionApprovalAction" NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionCampaignWork" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CampaignWorkType" NOT NULL,
    "status" "CampaignWorkStatus" NOT NULL DEFAULT 'NotStarted',
    "priority" "ElectionWorkPriority" NOT NULL DEFAULT 'Medium',
    "deadline" TIMESTAMP(3),
    "description" TEXT,
    "photoUrls" JSONB,
    "proofUrl" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "eventId" TEXT,
    "activityId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionCampaignWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionWorkAssignment" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "cadreId" TEXT,
    "teamId" TEXT,
    "role" TEXT,
    "status" "CampaignWorkStatus" NOT NULL DEFAULT 'NotStarted',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionWorkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVehicle" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" "ElectionVehicleType" NOT NULL,
    "ownerName" TEXT,
    "driverName" TEXT,
    "driverMobile" TEXT,
    "status" "ElectionVehicleStatus" NOT NULL DEFAULT 'Available',
    "documentUrls" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVehicleAssignment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "purpose" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "status" "ElectionVehicleStatus" NOT NULL DEFAULT 'Assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionVehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVehicleTripLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tripDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endKm" DOUBLE PRECISION,
    "route" TEXT,
    "gpsPlaceholder" TEXT,
    "driverName" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionVehicleTripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVehicleFuelLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fuelDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liters" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenseId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionVehicleFuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionBoothPlan" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "strength" "BoothStrength" NOT NULL DEFAULT 'Swing',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "voterCount" INTEGER NOT NULL DEFAULT 0,
    "issues" TEXT,
    "committeeNotes" TEXT,
    "campaignStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionBoothPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionPollingAgent" (
    "id" TEXT NOT NULL,
    "boothPlanId" TEXT NOT NULL,
    "cadreId" TEXT,
    "citizenId" TEXT,
    "name" TEXT,
    "mobile" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Polling Agent',
    "status" TEXT NOT NULL DEFAULT 'Assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionPollingAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVoterOutreach" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "citizenId" TEXT,
    "contactName" TEXT,
    "contactMobile" TEXT,
    "channel" "OutreachChannel" NOT NULL DEFAULT 'DoorToDoor',
    "stance" "VoterStance" NOT NULL DEFAULT 'Unknown',
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "isKeyVoter" BOOLEAN NOT NULL DEFAULT false,
    "isInfluencer" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "outreachDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionVoterOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionCampaignTeam" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignTeamType" NOT NULL,
    "leaderCadreId" TEXT,
    "description" TEXT,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionCampaignTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "role" TEXT,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionMaterial" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "type" "ElectionMaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "stockTotal" INTEGER NOT NULL DEFAULT 0,
    "stockIssued" INTEGER NOT NULL DEFAULT 0,
    "vendorName" TEXT,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionMaterialDistribution" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "returnedQty" INTEGER NOT NULL DEFAULT 0,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "mandalId" TEXT,
    "villageId" TEXT,
    "boothId" TEXT,
    "issuedToCadreId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionMaterialDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionPollingDayUpdate" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "boothPlanId" TEXT NOT NULL,
    "status" "PollingDayStatus" NOT NULL,
    "turnoutCount" INTEGER NOT NULL DEFAULT 0,
    "hour" INTEGER,
    "issueText" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionPollingDayUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionReport" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "type" "ElectionReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "filters" JSONB,
    "fileUrl" TEXT,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Election_status_idx" ON "Election"("status");

-- CreateIndex
CREATE INDEX "Election_constituencyId_idx" ON "Election"("constituencyId");

-- CreateIndex
CREATE INDEX "Election_electionDate_idx" ON "Election"("electionDate");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionExpenseCategory_name_key" ON "ElectionExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "ElectionExpense_electionId_idx" ON "ElectionExpense"("electionId");

-- CreateIndex
CREATE INDEX "ElectionExpense_status_idx" ON "ElectionExpense"("status");

-- CreateIndex
CREATE INDEX "ElectionExpense_categoryId_idx" ON "ElectionExpense"("categoryId");

-- CreateIndex
CREATE INDEX "ElectionExpense_expenseDate_idx" ON "ElectionExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "ElectionExpense_mandalId_idx" ON "ElectionExpense"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionExpense_villageId_idx" ON "ElectionExpense"("villageId");

-- CreateIndex
CREATE INDEX "ElectionExpense_boothId_idx" ON "ElectionExpense"("boothId");

-- CreateIndex
CREATE INDEX "ElectionExpenseApproval_expenseId_idx" ON "ElectionExpenseApproval"("expenseId");

-- CreateIndex
CREATE INDEX "ElectionExpenseApproval_approverId_idx" ON "ElectionExpenseApproval"("approverId");

-- CreateIndex
CREATE INDEX "ElectionCampaignWork_electionId_idx" ON "ElectionCampaignWork"("electionId");

-- CreateIndex
CREATE INDEX "ElectionCampaignWork_status_idx" ON "ElectionCampaignWork"("status");

-- CreateIndex
CREATE INDEX "ElectionCampaignWork_type_idx" ON "ElectionCampaignWork"("type");

-- CreateIndex
CREATE INDEX "ElectionCampaignWork_mandalId_idx" ON "ElectionCampaignWork"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionCampaignWork_boothId_idx" ON "ElectionCampaignWork"("boothId");

-- CreateIndex
CREATE INDEX "ElectionWorkAssignment_workId_idx" ON "ElectionWorkAssignment"("workId");

-- CreateIndex
CREATE INDEX "ElectionWorkAssignment_cadreId_idx" ON "ElectionWorkAssignment"("cadreId");

-- CreateIndex
CREATE INDEX "ElectionWorkAssignment_teamId_idx" ON "ElectionWorkAssignment"("teamId");

-- CreateIndex
CREATE INDEX "ElectionVehicle_electionId_idx" ON "ElectionVehicle"("electionId");

-- CreateIndex
CREATE INDEX "ElectionVehicle_status_idx" ON "ElectionVehicle"("status");

-- CreateIndex
CREATE INDEX "ElectionVehicle_vehicleNumber_idx" ON "ElectionVehicle"("vehicleNumber");

-- CreateIndex
CREATE INDEX "ElectionVehicleAssignment_vehicleId_idx" ON "ElectionVehicleAssignment"("vehicleId");

-- CreateIndex
CREATE INDEX "ElectionVehicleAssignment_mandalId_idx" ON "ElectionVehicleAssignment"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionVehicleAssignment_boothId_idx" ON "ElectionVehicleAssignment"("boothId");

-- CreateIndex
CREATE INDEX "ElectionVehicleTripLog_vehicleId_idx" ON "ElectionVehicleTripLog"("vehicleId");

-- CreateIndex
CREATE INDEX "ElectionVehicleTripLog_tripDate_idx" ON "ElectionVehicleTripLog"("tripDate");

-- CreateIndex
CREATE INDEX "ElectionVehicleFuelLog_vehicleId_idx" ON "ElectionVehicleFuelLog"("vehicleId");

-- CreateIndex
CREATE INDEX "ElectionVehicleFuelLog_fuelDate_idx" ON "ElectionVehicleFuelLog"("fuelDate");

-- CreateIndex
CREATE INDEX "ElectionBoothPlan_electionId_idx" ON "ElectionBoothPlan"("electionId");

-- CreateIndex
CREATE INDEX "ElectionBoothPlan_boothId_idx" ON "ElectionBoothPlan"("boothId");

-- CreateIndex
CREATE INDEX "ElectionBoothPlan_strength_idx" ON "ElectionBoothPlan"("strength");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionBoothPlan_electionId_boothId_key" ON "ElectionBoothPlan"("electionId", "boothId");

-- CreateIndex
CREATE INDEX "ElectionPollingAgent_boothPlanId_idx" ON "ElectionPollingAgent"("boothPlanId");

-- CreateIndex
CREATE INDEX "ElectionPollingAgent_cadreId_idx" ON "ElectionPollingAgent"("cadreId");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_electionId_idx" ON "ElectionVoterOutreach"("electionId");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_channel_idx" ON "ElectionVoterOutreach"("channel");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_stance_idx" ON "ElectionVoterOutreach"("stance");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_mandalId_idx" ON "ElectionVoterOutreach"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_boothId_idx" ON "ElectionVoterOutreach"("boothId");

-- CreateIndex
CREATE INDEX "ElectionVoterOutreach_citizenId_idx" ON "ElectionVoterOutreach"("citizenId");

-- CreateIndex
CREATE INDEX "ElectionCampaignTeam_electionId_idx" ON "ElectionCampaignTeam"("electionId");

-- CreateIndex
CREATE INDEX "ElectionCampaignTeam_type_idx" ON "ElectionCampaignTeam"("type");

-- CreateIndex
CREATE INDEX "ElectionCampaignTeam_mandalId_idx" ON "ElectionCampaignTeam"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionTeamMember_teamId_idx" ON "ElectionTeamMember"("teamId");

-- CreateIndex
CREATE INDEX "ElectionTeamMember_cadreId_idx" ON "ElectionTeamMember"("cadreId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionTeamMember_teamId_cadreId_key" ON "ElectionTeamMember"("teamId", "cadreId");

-- CreateIndex
CREATE INDEX "ElectionMaterial_electionId_idx" ON "ElectionMaterial"("electionId");

-- CreateIndex
CREATE INDEX "ElectionMaterial_type_idx" ON "ElectionMaterial"("type");

-- CreateIndex
CREATE INDEX "ElectionMaterialDistribution_materialId_idx" ON "ElectionMaterialDistribution"("materialId");

-- CreateIndex
CREATE INDEX "ElectionMaterialDistribution_mandalId_idx" ON "ElectionMaterialDistribution"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionMaterialDistribution_boothId_idx" ON "ElectionMaterialDistribution"("boothId");

-- CreateIndex
CREATE INDEX "ElectionPollingDayUpdate_electionId_idx" ON "ElectionPollingDayUpdate"("electionId");

-- CreateIndex
CREATE INDEX "ElectionPollingDayUpdate_boothPlanId_idx" ON "ElectionPollingDayUpdate"("boothPlanId");

-- CreateIndex
CREATE INDEX "ElectionPollingDayUpdate_status_idx" ON "ElectionPollingDayUpdate"("status");

-- CreateIndex
CREATE INDEX "ElectionPollingDayUpdate_createdAt_idx" ON "ElectionPollingDayUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "ElectionReport_electionId_idx" ON "ElectionReport"("electionId");

-- CreateIndex
CREATE INDEX "ElectionReport_type_idx" ON "ElectionReport"("type");

-- AddForeignKey
ALTER TABLE "Election" ADD CONSTRAINT "Election_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ElectionExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpense" ADD CONSTRAINT "ElectionExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpenseApproval" ADD CONSTRAINT "ElectionExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ElectionExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionExpenseApproval" ADD CONSTRAINT "ElectionExpenseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignWork" ADD CONSTRAINT "ElectionCampaignWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionWorkAssignment" ADD CONSTRAINT "ElectionWorkAssignment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "ElectionCampaignWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionWorkAssignment" ADD CONSTRAINT "ElectionWorkAssignment_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionWorkAssignment" ADD CONSTRAINT "ElectionWorkAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ElectionCampaignTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicle" ADD CONSTRAINT "ElectionVehicle_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleAssignment" ADD CONSTRAINT "ElectionVehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "ElectionVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleAssignment" ADD CONSTRAINT "ElectionVehicleAssignment_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleAssignment" ADD CONSTRAINT "ElectionVehicleAssignment_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleAssignment" ADD CONSTRAINT "ElectionVehicleAssignment_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleTripLog" ADD CONSTRAINT "ElectionVehicleTripLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "ElectionVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleTripLog" ADD CONSTRAINT "ElectionVehicleTripLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleFuelLog" ADD CONSTRAINT "ElectionVehicleFuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "ElectionVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleFuelLog" ADD CONSTRAINT "ElectionVehicleFuelLog_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ElectionExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVehicleFuelLog" ADD CONSTRAINT "ElectionVehicleFuelLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionBoothPlan" ADD CONSTRAINT "ElectionBoothPlan_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionBoothPlan" ADD CONSTRAINT "ElectionBoothPlan_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingAgent" ADD CONSTRAINT "ElectionPollingAgent_boothPlanId_fkey" FOREIGN KEY ("boothPlanId") REFERENCES "ElectionBoothPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingAgent" ADD CONSTRAINT "ElectionPollingAgent_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingAgent" ADD CONSTRAINT "ElectionPollingAgent_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVoterOutreach" ADD CONSTRAINT "ElectionVoterOutreach_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignTeam" ADD CONSTRAINT "ElectionCampaignTeam_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignTeam" ADD CONSTRAINT "ElectionCampaignTeam_leaderCadreId_fkey" FOREIGN KEY ("leaderCadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignTeam" ADD CONSTRAINT "ElectionCampaignTeam_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignTeam" ADD CONSTRAINT "ElectionCampaignTeam_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionCampaignTeam" ADD CONSTRAINT "ElectionCampaignTeam_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionTeamMember" ADD CONSTRAINT "ElectionTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ElectionCampaignTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionTeamMember" ADD CONSTRAINT "ElectionTeamMember_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterial" ADD CONSTRAINT "ElectionMaterial_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "ElectionMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_issuedToCadreId_fkey" FOREIGN KEY ("issuedToCadreId") REFERENCES "Cadre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionMaterialDistribution" ADD CONSTRAINT "ElectionMaterialDistribution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingDayUpdate" ADD CONSTRAINT "ElectionPollingDayUpdate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingDayUpdate" ADD CONSTRAINT "ElectionPollingDayUpdate_boothPlanId_fkey" FOREIGN KEY ("boothPlanId") REFERENCES "ElectionBoothPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingDayUpdate" ADD CONSTRAINT "ElectionPollingDayUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionReport" ADD CONSTRAINT "ElectionReport_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionReport" ADD CONSTRAINT "ElectionReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

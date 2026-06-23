-- CreateEnum
CREATE TYPE "WarRoomAlertSeverity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('Open', 'InProgress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "PermissionRequestType" AS ENUM ('Rally', 'Vehicle', 'Event', 'Loudspeaker', 'Police');

-- CreateEnum
CREATE TYPE "PermissionRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "MediaResponseStatus" AS ENUM ('Draft', 'PendingApproval', 'Approved', 'Published');

-- CreateEnum
CREATE TYPE "PromiseWorkStatus" AS ENUM ('NotStarted', 'InProgress', 'Completed', 'Delayed');

-- CreateEnum
CREATE TYPE "CrisisSeverity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "CrisisIssueStatus" AS ENUM ('Open', 'Active', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('Inbound', 'Outbound');

-- CreateEnum
CREATE TYPE "MergeSuggestionStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Completed');

-- CreateEnum
CREATE TYPE "OfflineSyncStatus" AS ENUM ('Pending', 'Synced', 'Failed', 'Conflict');

-- CreateTable
CREATE TABLE "WarRoomAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "WarRoomAlertSeverity" NOT NULL DEFAULT 'Medium',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "mandalId" TEXT,
    "boothId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarRoomAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBriefing" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "metrics" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothReadinessScore" (
    "id" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoothReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandalReadinessScore" (
    "id" TEXT NOT NULL,
    "mandalId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MandalReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionEscalation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EscalationStatus" NOT NULL DEFAULT 'Open',
    "priority" "GrievancePriority" NOT NULL DEFAULT 'Medium',
    "assignedToId" TEXT,
    "mandalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarRoomActivityFeed" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarRoomActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerAttendance" (
    "id" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geoVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCorrectionRequest" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AttendanceCorrectionStatus" NOT NULL DEFAULT 'Pending',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldRoutePoint" (
    "id" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldRoutePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoFenceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusM" INTEGER NOT NULL DEFAULT 100,
    "mandalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoFenceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyFieldReport" (
    "id" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyFieldReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundraisingEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "targetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundraisingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
    "eventId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationReceipt" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorFollowUp" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonorFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorCommunicationLog" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonorCommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceChecklist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ComplianceChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionRequest" (
    "id" TEXT NOT NULL,
    "type" "PermissionRequestType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PermissionRequestStatus" NOT NULL DEFAULT 'Pending',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "permissionRequestId" TEXT,
    "legalNoticeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "url" TEXT,
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressClipping" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clipDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PressClipping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderMention" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "sentiment" TEXT,

    CONSTRAINT "LeaderMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OppositionAttack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responseStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OppositionAttack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaResponse" (
    "id" TEXT NOT NULL,
    "attackId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MediaResponseStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationScoreSnapshot" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialListeningPlaceholder" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialListeningPlaceholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromiseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PromiseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionPromise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT,
    "department" TEXT,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "budgetTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workStatus" "PromiseWorkStatus" NOT NULL DEFAULT 'NotStarted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionPromise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromisePublicUpdate" (
    "id" TEXT NOT NULL,
    "promiseId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromisePublicUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromiseWorkStatusLog" (
    "id" TEXT NOT NULL,
    "promiseId" TEXT NOT NULL,
    "status" "PromiseWorkStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromiseWorkStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "CrisisSeverity" NOT NULL DEFAULT 'Medium',
    "status" "CrisisIssueStatus" NOT NULL DEFAULT 'Open',
    "villageId" TEXT,
    "mandalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrisisIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'Medium',
    "villageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtestEvent" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyResponse" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RapidResponseAssignment" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "cadreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RapidResponseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisTimelineEntry" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisTimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisEscalation" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "categoryId" TEXT,
    "permissionLevel" "AccessLevel" NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFile" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',

    CONSTRAINT "CallAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallQueue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CallQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL DEFAULT 'Inbound',
    "callerNumber" TEXT,
    "disposition" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "agentId" TEXT,
    "queueId" TEXT,
    "tempGrievanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallScript" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallFollowUpReminder" (
    "id" TEXT NOT NULL,
    "callLogId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CallFollowUpReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileMergeSuggestion" (
    "id" TEXT NOT NULL,
    "citizenIdA" TEXT NOT NULL,
    "citizenIdB" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MergeSuggestionStatus" NOT NULL DEFAULT 'Pending',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileMergeSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressNormalizationLog" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddressNormalizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileValidationLog" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileValidationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicCitizenSession" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "otpHash" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicCitizenSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicFeedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "mobile" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerRegistration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "village" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicEventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicEventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "mobile" TEXT,
    "purpose" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Pending',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "purpose" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VipContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderPersonalTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'Planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderPersonalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderScheduleBlock" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeStaffAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeStaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "exportType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "filePath" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspiciousActivityAlert" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'High',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspiciousActivityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncQueue" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OfflineSyncStatus" NOT NULL DEFAULT 'Pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "OfflineSyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarRoomAlert_resolved_idx" ON "WarRoomAlert"("resolved");

-- CreateIndex
CREATE INDEX "WarRoomAlert_severity_idx" ON "WarRoomAlert"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "BoothReadinessScore_boothId_key" ON "BoothReadinessScore"("boothId");

-- CreateIndex
CREATE UNIQUE INDEX "MandalReadinessScore_mandalId_key" ON "MandalReadinessScore"("mandalId");

-- CreateIndex
CREATE INDEX "ElectionEscalation_status_idx" ON "ElectionEscalation"("status");

-- CreateIndex
CREATE INDEX "WarRoomActivityFeed_createdAt_idx" ON "WarRoomActivityFeed"("createdAt");

-- CreateIndex
CREATE INDEX "VolunteerAttendance_cadreId_idx" ON "VolunteerAttendance"("cadreId");

-- CreateIndex
CREATE INDEX "VolunteerAttendance_checkInAt_idx" ON "VolunteerAttendance"("checkInAt");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_status_idx" ON "AttendanceCorrectionRequest"("status");

-- CreateIndex
CREATE INDEX "FieldRoutePoint_cadreId_idx" ON "FieldRoutePoint"("cadreId");

-- CreateIndex
CREATE INDEX "DailyFieldReport_cadreId_idx" ON "DailyFieldReport"("cadreId");

-- CreateIndex
CREATE INDEX "Donor_mobile_idx" ON "Donor"("mobile");

-- CreateIndex
CREATE INDEX "Donation_donorId_idx" ON "Donation"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_donationId_key" ON "DonationReceipt"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_receiptNo_key" ON "DonationReceipt"("receiptNo");

-- CreateIndex
CREATE INDEX "DonorFollowUp_donorId_idx" ON "DonorFollowUp"("donorId");

-- CreateIndex
CREATE INDEX "DonorCommunicationLog_donorId_idx" ON "DonorCommunicationLog"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceChecklist_name_key" ON "ComplianceChecklist"("name");

-- CreateIndex
CREATE INDEX "ComplianceChecklistItem_checklistId_idx" ON "ComplianceChecklistItem"("checklistId");

-- CreateIndex
CREATE INDEX "PermissionRequest_type_idx" ON "PermissionRequest"("type");

-- CreateIndex
CREATE INDEX "PermissionRequest_status_idx" ON "PermissionRequest"("status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_resolved_idx" ON "ComplianceAlert"("resolved");

-- CreateIndex
CREATE INDEX "LeaderMention_articleId_idx" ON "LeaderMention"("articleId");

-- CreateIndex
CREATE INDEX "MediaResponse_attackId_idx" ON "MediaResponse"("attackId");

-- CreateIndex
CREATE UNIQUE INDEX "PromiseCategory_name_key" ON "PromiseCategory"("name");

-- CreateIndex
CREATE INDEX "ElectionPromise_workStatus_idx" ON "ElectionPromise"("workStatus");

-- CreateIndex
CREATE INDEX "PromisePublicUpdate_promiseId_idx" ON "PromisePublicUpdate"("promiseId");

-- CreateIndex
CREATE INDEX "PromiseWorkStatusLog_promiseId_idx" ON "PromiseWorkStatusLog"("promiseId");

-- CreateIndex
CREATE INDEX "CrisisIssue_status_idx" ON "CrisisIssue"("status");

-- CreateIndex
CREATE INDEX "CrisisIssue_severity_idx" ON "CrisisIssue"("severity");

-- CreateIndex
CREATE INDEX "EmergencyResponse_issueId_idx" ON "EmergencyResponse"("issueId");

-- CreateIndex
CREATE INDEX "RapidResponseAssignment_responseId_idx" ON "RapidResponseAssignment"("responseId");

-- CreateIndex
CREATE INDEX "CrisisTimelineEntry_issueId_idx" ON "CrisisTimelineEntry"("issueId");

-- CreateIndex
CREATE INDEX "CrisisEscalation_issueId_idx" ON "CrisisEscalation"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_name_key" ON "DocumentCategory"("name");

-- CreateIndex
CREATE INDEX "DocumentFolder_parentId_idx" ON "DocumentFolder"("parentId");

-- CreateIndex
CREATE INDEX "DocumentFile_folderId_idx" ON "DocumentFile"("folderId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_fileId_idx" ON "DocumentAccessLog"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "CallAgent_userId_key" ON "CallAgent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CallQueue_name_key" ON "CallQueue"("name");

-- CreateIndex
CREATE INDEX "CallLog_direction_idx" ON "CallLog"("direction");

-- CreateIndex
CREATE INDEX "CallLog_createdAt_idx" ON "CallLog"("createdAt");

-- CreateIndex
CREATE INDEX "CallFollowUpReminder_callLogId_idx" ON "CallFollowUpReminder"("callLogId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_entityType_idx" ON "DataQualityIssue"("entityType");

-- CreateIndex
CREATE INDEX "DataQualityIssue_resolved_idx" ON "DataQualityIssue"("resolved");

-- CreateIndex
CREATE INDEX "ProfileMergeSuggestion_status_idx" ON "ProfileMergeSuggestion"("status");

-- CreateIndex
CREATE INDEX "PublicCitizenSession_mobile_idx" ON "PublicCitizenSession"("mobile");

-- CreateIndex
CREATE INDEX "PublicEventRegistration_eventId_idx" ON "PublicEventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "AppointmentRequest_status_idx" ON "AppointmentRequest"("status");

-- CreateIndex
CREATE INDEX "LeaderPersonalTask_status_idx" ON "LeaderPersonalTask"("status");

-- CreateIndex
CREATE INDEX "OfficeStaffAssignment_userId_idx" ON "OfficeStaffAssignment"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_createdAt_idx" ON "LoginHistory"("createdAt");

-- CreateIndex
CREATE INDEX "RoleActivityLog_createdAt_idx" ON "RoleActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "DataExportLog_createdAt_idx" ON "DataExportLog"("createdAt");

-- CreateIndex
CREATE INDEX "FileAccessLog_createdAt_idx" ON "FileAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "SuspiciousActivityAlert_resolved_idx" ON "SuspiciousActivityAlert"("resolved");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_tokenHash_idx" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_deviceId_idx" ON "OfflineSyncQueue"("deviceId");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_status_idx" ON "OfflineSyncQueue"("status");

-- CreateIndex
CREATE INDEX "SyncConflict_queueId_idx" ON "SyncConflict"("queueId");

-- AddForeignKey
ALTER TABLE "WarRoomAlert" ADD CONSTRAINT "WarRoomAlert_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarRoomAlert" ADD CONSTRAINT "WarRoomAlert_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBriefing" ADD CONSTRAINT "DailyBriefing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothReadinessScore" ADD CONSTRAINT "BoothReadinessScore_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandalReadinessScore" ADD CONSTRAINT "MandalReadinessScore_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionEscalation" ADD CONSTRAINT "ElectionEscalation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionEscalation" ADD CONSTRAINT "ElectionEscalation_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarRoomActivityFeed" ADD CONSTRAINT "WarRoomActivityFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAttendance" ADD CONSTRAINT "VolunteerAttendance_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "VolunteerAttendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldRoutePoint" ADD CONSTRAINT "FieldRoutePoint_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoFenceZone" ADD CONSTRAINT "GeoFenceZone_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyFieldReport" ADD CONSTRAINT "DailyFieldReport_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FundraisingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationReceipt" ADD CONSTRAINT "DonationReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorFollowUp" ADD CONSTRAINT "DonorFollowUp_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCommunicationLog" ADD CONSTRAINT "DonorCommunicationLog_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceChecklistItem" ADD CONSTRAINT "ComplianceChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "ComplianceChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_permissionRequestId_fkey" FOREIGN KEY ("permissionRequestId") REFERENCES "PermissionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_legalNoticeId_fkey" FOREIGN KEY ("legalNoticeId") REFERENCES "LegalNotice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderMention" ADD CONSTRAINT "LeaderMention_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaResponse" ADD CONSTRAINT "MediaResponse_attackId_fkey" FOREIGN KEY ("attackId") REFERENCES "OppositionAttack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPromise" ADD CONSTRAINT "ElectionPromise_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PromiseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromisePublicUpdate" ADD CONSTRAINT "PromisePublicUpdate_promiseId_fkey" FOREIGN KEY ("promiseId") REFERENCES "ElectionPromise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromiseWorkStatusLog" ADD CONSTRAINT "PromiseWorkStatusLog_promiseId_fkey" FOREIGN KEY ("promiseId") REFERENCES "ElectionPromise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisIssue" ADD CONSTRAINT "CrisisIssue_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisIssue" ADD CONSTRAINT "CrisisIssue_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "Mandal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveArea" ADD CONSTRAINT "SensitiveArea_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyResponse" ADD CONSTRAINT "EmergencyResponse_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CrisisIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapidResponseAssignment" ADD CONSTRAINT "RapidResponseAssignment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "EmergencyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapidResponseAssignment" ADD CONSTRAINT "RapidResponseAssignment_cadreId_fkey" FOREIGN KEY ("cadreId") REFERENCES "Cadre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisTimelineEntry" ADD CONSTRAINT "CrisisTimelineEntry_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CrisisIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisTimelineEntry" ADD CONSTRAINT "CrisisTimelineEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisEscalation" ADD CONSTRAINT "CrisisEscalation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CrisisIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisEscalation" ADD CONSTRAINT "CrisisEscalation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFile" ADD CONSTRAINT "DocumentFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "DocumentFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAgent" ADD CONSTRAINT "CallAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "CallAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "CallQueue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallFollowUpReminder" ADD CONSTRAINT "CallFollowUpReminder_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "CallLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMergeSuggestion" ADD CONSTRAINT "ProfileMergeSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicEventRegistration" ADD CONSTRAINT "PublicEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeStaffAssignment" ADD CONSTRAINT "OfficeStaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleActivityLog" ADD CONSTRAINT "RoleActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExportLog" ADD CONSTRAINT "DataExportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessLog" ADD CONSTRAINT "FileAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncConflict" ADD CONSTRAINT "SyncConflict_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "OfflineSyncQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
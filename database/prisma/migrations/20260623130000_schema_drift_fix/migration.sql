CREATE TYPE "GrievanceSlaViolationType" AS ENUM ('Validation', 'Resolution');
CREATE TYPE "GrievanceSlaViolationStatus" AS ENUM ('Open', 'Resolved');

ALTER TABLE "temporary_grievances"
  DROP CONSTRAINT "temporary_grievances_convertedGrievanceId_fkey";

ALTER TABLE "Grievance"
  ADD COLUMN "slaDays" INTEGER;

ALTER TABLE "Role"
  ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
  DROP COLUMN "name",
  ADD COLUMN "name" TEXT NOT NULL;

ALTER TABLE "temporary_grievances"
  ADD COLUMN "validationDueAt" TIMESTAMP(3);

CREATE TABLE "GrievanceSlaViolation" (
  "id" TEXT NOT NULL,
  "type" "GrievanceSlaViolationType" NOT NULL,
  "grievanceId" TEXT,
  "tempGrievanceId" TEXT,
  "slaDueAt" TIMESTAMP(3) NOT NULL,
  "breachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "overdueDays" INTEGER NOT NULL,
  "status" "GrievanceSlaViolationStatus" NOT NULL DEFAULT 'Open',
  "dedupeKey" TEXT NOT NULL,
  "lastNotifiedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GrievanceSlaViolation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrievanceSlaViolation_dedupeKey_key"
  ON "GrievanceSlaViolation"("dedupeKey");

CREATE INDEX "GrievanceSlaViolation_type_idx"
  ON "GrievanceSlaViolation"("type");

CREATE INDEX "GrievanceSlaViolation_status_idx"
  ON "GrievanceSlaViolation"("status");

CREATE INDEX "GrievanceSlaViolation_grievanceId_idx"
  ON "GrievanceSlaViolation"("grievanceId");

CREATE INDEX "GrievanceSlaViolation_tempGrievanceId_idx"
  ON "GrievanceSlaViolation"("tempGrievanceId");

CREATE INDEX "GrievanceSlaViolation_overdueDays_idx"
  ON "GrievanceSlaViolation"("overdueDays");

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

CREATE INDEX "temporary_grievances_validationDueAt_idx"
  ON "temporary_grievances"("validationDueAt");

ALTER TABLE "GrievanceSlaViolation"
  ADD CONSTRAINT "GrievanceSlaViolation_grievanceId_fkey"
  FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GrievanceSlaViolation"
  ADD CONSTRAINT "GrievanceSlaViolation_tempGrievanceId_fkey"
  FOREIGN KEY ("tempGrievanceId") REFERENCES "temporary_grievances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
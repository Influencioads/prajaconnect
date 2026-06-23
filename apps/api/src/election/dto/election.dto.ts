import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  BoothStrength,
  CampaignTeamType,
  CampaignWorkStatus,
  CampaignWorkType,
  ElectionExpenseStatus,
  ElectionMaterialType,
  ElectionReportType,
  ElectionStatus,
  ElectionVehicleStatus,
  ElectionVehicleType,
  ElectionWorkPriority,
  OutreachChannel,
  PaymentMode,
  PollingDayStatus,
  VoterStance,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ElectionQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

export class CreateElectionDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  electionDate?: string;

  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

export class UpdateElectionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  electionDate?: string;

  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

export class ElectionScopeDto {
  @IsOptional()
  @IsString()
  electionId?: string;
}

export class ExpenseQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(ElectionExpenseStatus)
  status?: ElectionExpenseStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  categoryId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  paidBy?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  billUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  activityId?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  paidBy?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsEnum(ElectionExpenseStatus)
  status?: ElectionExpenseStatus;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  billUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExpenseApprovalDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class WorkQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(CampaignWorkType)
  type?: CampaignWorkType;

  @IsOptional()
  @IsEnum(CampaignWorkStatus)
  status?: CampaignWorkStatus;

  @IsOptional()
  @IsEnum(ElectionWorkPriority)
  priority?: ElectionWorkPriority;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class CreateWorkDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsEnum(CampaignWorkType)
  type!: CampaignWorkType;

  @IsOptional()
  @IsEnum(CampaignWorkStatus)
  status?: CampaignWorkStatus;

  @IsOptional()
  @IsEnum(ElectionWorkPriority)
  priority?: ElectionWorkPriority;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  activityId?: string;
}

export class UpdateWorkDto extends CreateWorkDto {}

export class AssignWorkDto {
  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(CampaignWorkStatus)
  status?: CampaignWorkStatus;
}

export class VehicleQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(ElectionVehicleType)
  vehicleType?: ElectionVehicleType;

  @IsOptional()
  @IsEnum(ElectionVehicleStatus)
  status?: ElectionVehicleStatus;
}

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  vehicleNumber!: string;

  @IsEnum(ElectionVehicleType)
  vehicleType!: ElectionVehicleType;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverMobile?: string;

  @IsOptional()
  @IsEnum(ElectionVehicleStatus)
  status?: ElectionVehicleStatus;

  @IsOptional()
  documentUrls?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto extends CreateVehicleDto {}

export class VehicleAssignmentDto {
  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class TripLogDto {
  @IsOptional()
  @IsDateString()
  tripDate?: string;

  @IsNumber()
  startKm!: number;

  @IsOptional()
  @IsNumber()
  endKm?: number;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  gpsPlaceholder?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FuelLogDto {
  @IsOptional()
  @IsDateString()
  fuelDate?: string;

  @IsOptional()
  @IsNumber()
  liters?: number;

  @IsNumber()
  cost!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  createExpense?: boolean;
}

export class BoothQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(BoothStrength)
  strength?: BoothStrength;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;
}

export class CreateBoothPlanDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  boothId!: string;

  @IsOptional()
  @IsEnum(BoothStrength)
  strength?: BoothStrength;

  @IsOptional()
  @IsInt()
  readinessScore?: number;

  @IsOptional()
  @IsInt()
  voterCount?: number;

  @IsOptional()
  @IsString()
  issues?: string;

  @IsOptional()
  @IsString()
  committeeNotes?: string;

  @IsOptional()
  @IsString()
  campaignStatus?: string;
}

export class UpdateBoothPlanDto extends CreateBoothPlanDto {}

export class PollingAgentDto {
  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class OutreachQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(OutreachChannel)
  channel?: OutreachChannel;

  @IsOptional()
  @IsEnum(VoterStance)
  stance?: VoterStance;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  followUpRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isKeyVoter?: boolean;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class CreateOutreachDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactMobile?: string;

  @IsOptional()
  @IsEnum(OutreachChannel)
  channel?: OutreachChannel;

  @IsOptional()
  @IsEnum(VoterStance)
  stance?: VoterStance;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isKeyVoter?: boolean;

  @IsOptional()
  @IsBoolean()
  isInfluencer?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class UpdateOutreachDto extends CreateOutreachDto {}

export class TeamQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(CampaignTeamType)
  type?: CampaignTeamType;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

export class CreateTeamDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  name!: string;

  @IsEnum(CampaignTeamType)
  type!: CampaignTeamType;

  @IsOptional()
  @IsString()
  leaderCadreId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class UpdateTeamDto extends CreateTeamDto {}

export class TeamMemberDto {
  @IsString()
  cadreId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class MaterialQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsEnum(ElectionMaterialType)
  type?: ElectionMaterialType;
}

export class CreateMaterialDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsEnum(ElectionMaterialType)
  type!: ElectionMaterialType;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  stockTotal?: number;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaterialDto extends CreateMaterialDto {}

export class MaterialDistributionDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  issuedToCadreId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MaterialReturnDto {
  @IsInt()
  @Min(1)
  returnedQty!: number;
}

export class PollingDayQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsString()
  boothPlanId?: string;

  @IsOptional()
  @IsEnum(PollingDayStatus)
  status?: PollingDayStatus;
}

export class CreatePollingUpdateDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsString()
  boothPlanId!: string;

  @IsEnum(PollingDayStatus)
  status!: PollingDayStatus;

  @IsOptional()
  @IsInt()
  turnoutCount?: number;

  @IsOptional()
  @IsInt()
  hour?: number;

  @IsOptional()
  @IsString()
  issueText?: string;

  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReportExportQueryDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsOptional()
  @IsString()
  format?: 'csv' | 'xlsx' | 'pdf';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateReportDto {
  @IsOptional()
  @IsString()
  electionId?: string;

  @IsEnum(ElectionReportType)
  type!: ElectionReportType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  filters?: Record<string, unknown>;
}

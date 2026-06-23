import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  TempGrievancePriority,
  TempGrievanceSource,
  TempGrievanceStatus,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TempGrievanceQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TempGrievanceSource)
  source?: TempGrievanceSource;

  @IsOptional()
  @IsEnum(TempGrievanceStatus)
  status?: TempGrievanceStatus;

  @IsOptional()
  @IsEnum(TempGrievancePriority)
  priority?: TempGrievancePriority;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  assignedValidatorId?: string;

  @IsOptional()
  @IsString()
  duplicateRisk?: string;

  @IsOptional()
  @IsString()
  issueCategory?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateTempGrievanceDto {
  @IsEnum(TempGrievanceSource)
  source!: TempGrievanceSource;

  @IsOptional()
  @IsString()
  sourceReferenceId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  citizenName?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

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
  wardId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  issueCategory?: string;

  @IsOptional()
  @IsString()
  issueSummary?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  issueDescription?: string;

  @IsOptional()
  @IsString()
  originalMessage?: string;

  @IsOptional()
  @IsEnum(TempGrievancePriority)
  priority?: TempGrievancePriority;

  @IsOptional()
  @IsString()
  voiceRecordingUrl?: string;

  @IsOptional()
  @IsString()
  whatsappChatUrl?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateTempGrievanceDto {
  @IsOptional()
  @IsString()
  citizenName?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  issueCategory?: string;

  @IsOptional()
  @IsString()
  issueSummary?: string;

  @IsOptional()
  @IsString()
  issueDescription?: string;

  @IsOptional()
  @IsEnum(TempGrievancePriority)
  priority?: TempGrievancePriority;

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
  wardId?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class ValidateTempGrievanceDto {
  @IsObject()
  checklist!: Record<string, boolean>;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ConvertTempGrievanceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  assignedOfficialId?: string;

  @IsOptional()
  @IsString()
  assignedCadreId?: string;

  @IsOptional()
  @IsEnum(TempGrievancePriority)
  priority?: TempGrievancePriority;

  @IsOptional()
  @IsBoolean()
  notifyCitizen?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  slaDays?: number;
}

export class RejectTempGrievanceDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class ArchiveTempGrievanceDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class MarkDuplicateDto {
  @IsOptional()
  @IsString()
  matchedGrievanceId?: string;

  @IsOptional()
  @IsString()
  matchedTempId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MergeTempGrievanceDto {
  @IsString()
  targetGrievanceId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RequestMoreInfoDto {
  @IsString()
  @MinLength(3)
  message!: string;
}

export class AssignValidatorDto {
  @IsString()
  validatorId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddTempGrievanceNoteDto {
  @IsString()
  @MinLength(1)
  note!: string;
}

export class FromCallDto {
  @IsString()
  activityId!: string;
}

export class FromWhatsappDto {
  @IsString()
  conversationId!: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}

export class FromD2dSurveyDto {
  @IsString()
  responseId!: string;
}

export class FromEmailDto {
  @IsString()
  activityId!: string;
}

export class FromFieldVisitDto {
  @IsString()
  activityId!: string;
}

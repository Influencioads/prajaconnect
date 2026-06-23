import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  D2DPriority,
  D2DQuestionType,
  D2DSentiment,
  D2DSurveyStatus,
  D2DSurveyType,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class D2DSurveyQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(D2DSurveyStatus)
  status?: D2DSurveyStatus;

  @IsOptional()
  @IsEnum(D2DSurveyType)
  type?: D2DSurveyType;

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

export class CreateD2DSurveyDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  nameTe?: string;

  @IsEnum(D2DSurveyType)
  type!: D2DSurveyType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  targetMandalId?: string;

  @IsOptional()
  @IsString()
  targetVillageId?: string;

  @IsOptional()
  @IsString()
  targetBoothId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetHouseholds?: number;
}

export class UpdateD2DSurveyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameTe?: string;

  @IsOptional()
  @IsEnum(D2DSurveyType)
  type?: D2DSurveyType;

  @IsOptional()
  @IsEnum(D2DSurveyStatus)
  status?: D2DSurveyStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  targetMandalId?: string;

  @IsOptional()
  @IsString()
  targetVillageId?: string;

  @IsOptional()
  @IsString()
  targetBoothId?: string;

  @IsOptional()
  @IsInt()
  targetHouseholds?: number;
}

export class D2DQuestionOptionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  order!: number;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  labelTe?: string;

  @IsString()
  value!: string;
}

export class D2DQuestionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  order!: number;

  @IsEnum(D2DQuestionType)
  type!: D2DQuestionType;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  labelTe?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => D2DQuestionOptionDto)
  options?: D2DQuestionOptionDto[];
}

export class SaveQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => D2DQuestionDto)
  questions!: D2DQuestionDto[];
}

export class AssignSurveyDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

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
  street?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dailyTarget?: number;
}

export class D2DAssignmentQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  surveyId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

export class D2DResponseQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  surveyId?: string;

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
  volunteerId?: string;

  @IsOptional()
  @IsEnum(D2DSentiment)
  sentiment?: D2DSentiment;

  @IsOptional()
  @IsString()
  status?: string;
}

export class D2DAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  value?: unknown;
}

export class D2DFamilyMemberDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  voterId?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsEnum(D2DSentiment)
  votingPreference?: D2DSentiment;

  @IsOptional()
  schemeBenefits?: unknown;

  @IsOptional()
  issues?: unknown;
}

export class D2DHouseholdDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsString()
  headName!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  street?: string;

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
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => D2DFamilyMemberDto)
  members?: D2DFamilyMemberDto[];
}

export class CreateD2DResponseDto {
  @IsString()
  surveyId!: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => D2DHouseholdDto)
  household?: D2DHouseholdDto;

  @IsOptional()
  @IsString()
  householdId?: string;

  @IsOptional()
  @IsEnum(D2DSentiment)
  sentiment?: D2DSentiment;

  @IsOptional()
  @IsEnum(D2DPriority)
  priority?: D2DPriority;

  @IsOptional()
  @IsBoolean()
  needsFollowup?: boolean;

  @IsOptional()
  @IsBoolean()
  isKeyVoter?: boolean;

  @IsOptional()
  @IsBoolean()
  influencer?: boolean;

  @IsOptional()
  issues?: unknown;

  @IsOptional()
  @IsInt()
  timeTakenSec?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => D2DAnswerDto)
  answers?: D2DAnswerDto[];

  @IsOptional()
  @IsArray()
  photos?: { url: string; label?: string }[];
}

export class ConvertGrievanceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class ConvertCitizenDto {
  @IsOptional()
  @IsBoolean()
  createFamily?: boolean;
}

export class CreateFollowupDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}

export class D2DAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  surveyId?: string;

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

export class D2DReportQueryDto {
  @IsOptional()
  @IsString()
  surveyId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class D2DSyncBatchDto {
  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsArray()
  households?: D2DHouseholdDto[];

  @IsOptional()
  @IsArray()
  responses?: CreateD2DResponseDto[];
}

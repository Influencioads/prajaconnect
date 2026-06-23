import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { SurveyStatus } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SurveyQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;
}

export class CreateSurveyDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;

  @IsArray()
  questions!: unknown[];

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;

  @IsOptional()
  @IsArray()
  questions?: unknown[];
}

export class SubmitResponseDto {
  @IsObject()
  answers!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  respondentName?: string;

  @IsOptional()
  @IsString()
  respondentMobile?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;
}

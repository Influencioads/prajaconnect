import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BeneficiaryStatus, SchemeStatus } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SchemeQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SchemeStatus)
  status?: SchemeStatus;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateSchemeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsObject()
  eligibility?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  benefitAmount?: number;

  @IsOptional()
  @IsEnum(SchemeStatus)
  status?: SchemeStatus;
}

export class UpdateSchemeDto extends CreateSchemeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  declare code: string;
}

export class EnrollDto {
  @IsString()
  citizenId!: string;

  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;
}

export class UpdateBeneficiaryDto {
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;

  @IsOptional()
  @IsNumber()
  disbursedAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class EligibilityCheckDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  income?: number;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsBoolean()
  hasSchoolChild?: boolean;

  @IsOptional()
  @IsBoolean()
  ownsHouse?: boolean;
}

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const FUND_STAGES = [
  'Recommended',
  'Sanctioned',
  'Released',
  'Completed',
  'UCSubmitted',
] as const;
export type FundStage = (typeof FUND_STAGES)[number];

export class CreateFundSourceDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  financialYear!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allocated?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFundSourceDto extends CreateFundSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  declare name: string;

  @IsOptional()
  @IsString()
  declare financialYear: string;
}

export class FundWorkQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  fundSourceId?: string;

  @IsOptional()
  @IsIn(FUND_STAGES)
  stage?: FundStage;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

export class CreateFundWorkDto {
  @IsString()
  fundSourceId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFundWorkDto extends CreateFundWorkDto {
  @IsOptional()
  @IsString()
  declare fundSourceId: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  declare title: string;
}

export class AdvanceStageDto {
  @IsIn(FUND_STAGES)
  stage!: FundStage;

  @IsOptional()
  @IsString()
  sanctionNo?: string;

  /** Installment amount when advancing to Released. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateInstallmentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  releasedAt?: string;
}

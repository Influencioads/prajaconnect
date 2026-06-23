import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VoterDuplicateStatus, VoterIntelligenceSource, VoterPreference } from '@prisma/client';

export class ProfileQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(VoterPreference)
  preference?: VoterPreference;

  @IsOptional()
  @IsString()
  segmentId?: string;

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
  @Type(() => Boolean)
  @IsBoolean()
  isKeyVoter?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isInfluencer?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSwing?: boolean;
}

export class CreateProfileDto {
  @IsString()
  citizenId!: string;

  @IsOptional()
  @IsEnum(VoterPreference)
  preference?: VoterPreference;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isKeyVoter?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isInfluencer?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSwing?: boolean;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsEnum(VoterIntelligenceSource)
  source?: VoterIntelligenceSource;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(VoterPreference)
  preference?: VoterPreference;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isKeyVoter?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isInfluencer?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSwing?: boolean;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSegmentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class DuplicateQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(VoterDuplicateStatus)
  status?: VoterDuplicateStatus;
}

export class ReviewDuplicateDto {
  @IsEnum(VoterDuplicateStatus)
  status!: VoterDuplicateStatus;
}

export class ImportRollDto {
  @IsString()
  fileName!: string;

  @IsOptional()
  entries?: Array<{
    epicNo: string;
    name: string;
    relationName?: string;
    age?: number;
    partNo?: string;
    serialNo?: string;
    address?: string;
    boothId?: string;
  }>;
}

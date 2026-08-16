import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const CAMP_STATUSES = ['Planned', 'Ongoing', 'Completed', 'Cancelled'];

export class CampQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(CAMP_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  upcoming?: boolean;
}

export class CreateCampDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsString()
  date!: string;

  @IsOptional()
  @IsIn(CAMP_STATUSES)
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSchemes?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCampDto extends CreateCampDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  declare name: string;

  @IsOptional()
  @IsString()
  declare date: string;
}

export class PreregisterMatchesDto {
  @IsArray()
  @IsString({ each: true })
  schemeIds!: string[];
}

export class WalkInDto {
  @IsString()
  citizenId!: string;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class UpdateRegistrationDto {
  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsBoolean()
  resolvedOnSpot?: boolean;

  @IsOptional()
  @IsString()
  purpose?: string;
}

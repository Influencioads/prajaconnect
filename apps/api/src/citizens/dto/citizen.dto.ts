import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { CitizenStatus, Gender } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CitizenQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CitizenStatus)
  status?: CitizenStatus;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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
  familyId?: string;
}

export class CreateCitizenDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  age?: number;

  @IsOptional()
  @IsString()
  voterId?: string;

  @IsOptional()
  @IsString()
  aadhaarMasked?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(CitizenStatus)
  status?: CitizenStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  familyId?: string;

  @IsOptional()
  @IsBoolean()
  isFamilyHead?: boolean;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

export class UpdateCitizenDto extends CreateCitizenDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;
}

export class CreateFamilyDto {
  @IsString()
  @MinLength(2)
  headName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  rationCard?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

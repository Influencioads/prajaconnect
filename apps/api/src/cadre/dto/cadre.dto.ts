import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { CadreStatus, OfficialLevel } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CadreQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CadreStatus)
  status?: CadreStatus;

  @IsOptional()
  @IsEnum(OfficialLevel)
  level?: OfficialLevel;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

export class CreateCadreDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(7)
  mobile!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(2)
  designation!: string;

  @IsOptional()
  @IsEnum(OfficialLevel)
  level?: OfficialLevel;

  @IsOptional()
  @IsEnum(CadreStatus)
  status?: CadreStatus;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  performance?: number;
}

export class UpdateCadreDto extends CreateCadreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  declare designation: string;
}

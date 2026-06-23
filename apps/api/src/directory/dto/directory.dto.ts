import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { OfficialLevel } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slaHours?: number;
}

export class UpdateDepartmentDto extends CreateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;
}

export class OfficialQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OfficialLevel)
  level?: OfficialLevel;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class CreateOfficialDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  designation!: string;

  @IsOptional()
  @IsEnum(OfficialLevel)
  level?: OfficialLevel;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  office?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escalationOrder?: number;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class UpdateOfficialDto extends CreateOfficialDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  declare designation: string;
}

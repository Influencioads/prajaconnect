import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

// ===== State =====
export class CreateStateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  code!: string;
}

export class UpdateStateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;
}

// ===== District =====
export class CreateDistrictDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  stateId!: string;
}

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  stateId?: string;
}

// ===== Constituency =====
export class CreateConstituencyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  number?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  districtId!: string;
}

export class UpdateConstituencyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  number?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  districtId?: string;
}

// ===== Mandal =====
export class CreateMandalDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  constituencyId!: string;
}

export class UpdateMandalDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;
}

// ===== Village =====
export class CreateVillageDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsString()
  mandalId!: string;
}

export class UpdateVillageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

// ===== Booth =====
export class CreateBoothDto {
  @IsString()
  @MinLength(1)
  number!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  voterCount?: number;

  @IsString()
  villageId!: string;
}

export class UpdateBoothDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  number?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  voterCount?: number;

  @IsOptional()
  @IsString()
  villageId?: string;
}

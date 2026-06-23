import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AssetCategory, AssetCondition, AssetStatus } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AssetQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

/** Nested category-specific detail payloads. Validated loosely as objects. */
export class RoadDetailDto {
  @IsOptional() @IsString() roadType?: string;
  @IsOptional() @IsNumber() lengthKm?: number;
  @IsOptional() @IsNumber() widthM?: number;
  @IsOptional() @IsString() lastRepairDate?: string;
}

export class HospitalDetailDto {
  @IsOptional() @IsString() hospitalType?: string;
  @IsOptional() @IsNumber() doctorsCount?: number;
  @IsOptional() @IsNumber() bedsCount?: number;
  @IsOptional() @IsNumber() ambulances?: number;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() services?: string;
}

export class SchoolDetailDto {
  @IsOptional() @IsString() schoolType?: string;
  @IsOptional() @IsNumber() studentCount?: number;
  @IsOptional() @IsNumber() teacherCount?: number;
  @IsOptional() @IsBoolean() midDayMeal?: boolean;
  @IsOptional() @IsNumber() performanceScore?: number;
}

export class RwsDetailDto {
  @IsOptional() @IsString() assetType?: string;
  @IsOptional() @IsBoolean() functional?: boolean;
  @IsOptional() @IsString() distributionStatus?: string;
}

export class CreateAssetDto {
  @IsEnum(AssetCategory)
  category!: AssetCategory;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
  @IsOptional() @IsEnum(AssetCondition) condition?: AssetCondition;
  @IsOptional() @IsString() contractor?: string;

  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() address?: string;

  @IsOptional() @IsString() wardNumber?: string;
  @IsOptional() @IsString() villageId?: string;
  @IsOptional() @IsString() mandalId?: string;
  @IsOptional() @IsString() constituencyId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() projectId?: string;

  @IsOptional() @IsObject() attributes?: Record<string, unknown>;

  @IsOptional() @IsObject() road?: RoadDetailDto;
  @IsOptional() @IsObject() hospital?: HospitalDetailDto;
  @IsOptional() @IsObject() school?: SchoolDetailDto;
  @IsOptional() @IsObject() rws?: RwsDetailDto;
}

export class UpdateAssetDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
  @IsOptional() @IsEnum(AssetCondition) condition?: AssetCondition;
  @IsOptional() @IsString() contractor?: string;

  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() address?: string;

  @IsOptional() @IsString() wardNumber?: string;
  @IsOptional() @IsString() villageId?: string;
  @IsOptional() @IsString() mandalId?: string;
  @IsOptional() @IsString() constituencyId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() projectId?: string;

  @IsOptional() @IsObject() attributes?: Record<string, unknown>;

  @IsOptional() @IsObject() road?: RoadDetailDto;
  @IsOptional() @IsObject() hospital?: HospitalDetailDto;
  @IsOptional() @IsObject() school?: SchoolDetailDto;
  @IsOptional() @IsObject() rws?: RwsDetailDto;
}

export class AddMaintenanceLogDto {
  @IsString() @MinLength(2) type!: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsString() performedBy?: string;
  @IsOptional() @IsString() performedAt?: string;
}

export class AddAttachmentDto {
  @IsString() url!: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsNumber() size?: number;
}

export class ImportAssetsDto {
  @IsString() csv!: string;
  @IsOptional() @IsEnum(AssetCategory) category?: AssetCategory;
}

import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  GrievanceChannel,
  GrievancePriority,
  GrievanceStatus,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GrievanceQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(GrievanceStatus)
  status?: GrievanceStatus;

  @IsOptional()
  @IsEnum(GrievancePriority)
  priority?: GrievancePriority;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  assignedOfficialId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateGrievanceDto {
  @IsString()
  @MinLength(4)
  title!: string;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(GrievanceChannel)
  channel?: GrievanceChannel;

  @IsOptional()
  @IsEnum(GrievancePriority)
  priority?: GrievancePriority;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  reportedByName?: string;

  @IsOptional()
  @IsString()
  reportedByMobile?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  /** Custom resolution timeline in days (overrides department default). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  slaDays?: number;
}

export class UpdateGrievanceDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(GrievancePriority)
  priority?: GrievancePriority;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  slaDays?: number;
}

export class AssignGrievanceDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  assignedOfficialId?: string;

  @IsOptional()
  @IsString()
  assignedCadreId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  slaDays?: number;
}

export class ChangeStatusDto {
  @IsEnum(GrievanceStatus)
  status!: GrievanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddNoteDto {
  @IsString()
  @MinLength(1)
  note!: string;
}

export class FeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

import { GrievanceSlaViolationStatus, GrievanceSlaViolationType } from '@praja/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SlaViolationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(GrievanceSlaViolationType)
  type?: GrievanceSlaViolationType;

  @IsOptional()
  @IsEnum(GrievanceSlaViolationStatus)
  status?: GrievanceSlaViolationStatus;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minOverdueDays?: number;
}

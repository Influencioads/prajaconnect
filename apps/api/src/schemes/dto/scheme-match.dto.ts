import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const SCHEME_MATCH_STATUSES = ['Suggested', 'Contacted', 'Applied', 'Enrolled', 'NotEligible'];

export class MatchQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(SCHEME_MATCH_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;
}

export class UpdateMatchDto {
  @IsOptional()
  @IsIn(SCHEME_MATCH_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  assignedCadreId?: string;
}

export class WorklistQueryDto {
  @IsOptional()
  @IsIn(SCHEME_MATCH_STATUSES)
  status?: string;
}

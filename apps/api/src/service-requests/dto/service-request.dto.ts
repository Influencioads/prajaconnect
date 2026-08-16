import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const SERVICE_REQUEST_TYPES = [
  'IncomeCertificate',
  'CasteCertificate',
  'Pension',
  'JobCard',
  'Transfer',
  'LandRecord',
  'Other',
] as const;

export const SERVICE_REQUEST_STATUSES = [
  'Received',
  'Forwarded',
  'InProcess',
  'Completed',
  'Rejected',
] as const;

export class ServiceRequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(SERVICE_REQUEST_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsIn(SERVICE_REQUEST_TYPES as unknown as string[])
  type?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  /** When 'me', restrict to requests assigned to the current user. */
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateServiceRequestDto {
  @IsString()
  @MinLength(2)
  applicantName!: string;

  @IsString()
  @MinLength(6)
  mobile!: string;

  @IsIn(SERVICE_REQUEST_TYPES as unknown as string[])
  type!: string;

  @IsString()
  @MinLength(3)
  details!: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsString()
  applicantName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsIn(SERVICE_REQUEST_TYPES as unknown as string[])
  type?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class ChangeServiceRequestStatusDto {
  @IsIn(SERVICE_REQUEST_STATUSES as unknown as string[])
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;
}

export class ForwardServiceRequestDto {
  @IsString()
  departmentId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/** Public intake — mobile must match a verified OTP session (see /public-portal/auth/otp-*). */
export class PublicServiceRequestDto {
  @IsString()
  sessionId!: string;

  @IsString()
  @MinLength(2)
  applicantName!: string;

  @IsString()
  @MinLength(6)
  mobile!: string;

  @IsIn(SERVICE_REQUEST_TYPES as unknown as string[])
  type!: string;

  @IsString()
  @MinLength(3)
  details!: string;

  @IsOptional()
  @IsString()
  villageId?: string;
}

export class VolunteerProfileQueryDto extends PaginationDto {
  /** Comma-separated skill list — a profile matches if it has any of them. */
  @IsOptional()
  @IsString()
  skills?: string;

  /** 'true' | 'false' — Boolean('false') is truthy, so this stays a string on the wire. */
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string;
}

export class UpdateVolunteerProfileDto {
  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class AssignVolunteerTaskDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;
}

export class LogVolunteerHoursDto {
  @IsNumber()
  @Min(0.1)
  hours!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

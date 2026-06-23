import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AppointmentStatus } from '@praja/database';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(2)
  visitorName!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(3)
  purpose!: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  visitorName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  purpose?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

export class AppointmentCalendarQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class ScheduleQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class CreateScheduleBlockDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  startAt!: string;

  @IsString()
  endAt!: string;
}

export class UpdateScheduleBlockDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;
}

export class AppointmentQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

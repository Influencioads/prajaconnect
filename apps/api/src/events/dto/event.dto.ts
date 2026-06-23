import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { EventStatus, EventType } from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class EventQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  startAt!: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsString()
  venue?: string;

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
  organizerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedAttendees?: number;
}

export class UpdateEventDto extends CreateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  declare title: string;

  @IsOptional()
  @IsString()
  declare startAt: string;
}

export class CheckInDto {
  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}

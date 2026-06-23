import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ActivityDirection,
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  CampaignStatus,
  CampaignType,
  ParticipantStatus,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ActivityQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @IsOptional()
  @IsEnum(ActivityDirection)
  direction?: ActivityDirection;

  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  constituencyId?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  /** ISO date — inclusive lower bound on the activity's primary date. */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date — inclusive upper bound on the activity's primary date. */
  @IsOptional()
  @IsString()
  to?: string;

  /** When 'me', restrict to activities assigned to the current user. */
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateActivityDto {
  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  subType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @IsOptional()
  @IsEnum(ActivityDirection)
  direction?: ActivityDirection;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  endedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  reminderAt?: string;

  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactMobile?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  officialId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;

  @IsOptional()
  @IsString()
  surveyId?: string;

  @IsOptional()
  @IsString()
  assignedToUserId?: string;

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
  boothId?: string;
}

export class UpdateActivityDto extends CreateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  declare type: ActivityType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  declare title: string;
}

export class ChangeActivityStatusDto {
  @IsEnum(ActivityStatus)
  status!: ActivityStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteActivityDto {
  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddActivityNoteDto {
  @IsString()
  @MinLength(1)
  note!: string;
}

export class AddParticipantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(ParticipantStatus)
  status?: ParticipantStatus;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class AddReminderDto {
  @IsString()
  remindAt!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  forUserId?: string;
}

export class ActivityCalendarQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;
}

export class ActivityTimelineQueryDto {
  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CampaignQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(CampaignType)
  type!: CampaignType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetCount?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  constituencyId?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reachedCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  responseCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  conversionCount?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsNumber()
  spent?: number;

  @IsOptional()
  @IsBoolean()
  recomputeMetrics?: boolean;
}

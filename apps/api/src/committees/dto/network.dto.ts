import { Type } from 'class-transformer';
import {
  IsEmail,
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
  CommitteeCategory,
  Gender,
  JournalistType,
  NetworkEntityType,
  NetworkStatus,
} from '@praja/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ---------------------------------------------------------------------------
// Shared query
// ---------------------------------------------------------------------------
export class NetworkQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class CommitteeMemberQueryDto extends NetworkQueryDto {
  @IsOptional()
  @IsEnum(CommitteeCategory)
  category?: CommitteeCategory;

  @IsOptional()
  @IsString()
  committeeId?: string;
}

export class CommitteeQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;

  @IsOptional()
  @IsEnum(CommitteeCategory)
  category?: CommitteeCategory;

  @IsOptional()
  @IsString()
  mandalId?: string;
}

export class PressQueryDto extends NetworkQueryDto {
  @IsOptional()
  @IsEnum(JournalistType)
  journalistType?: JournalistType;
}

// ---------------------------------------------------------------------------
// Common create fields (shared by all member-type entities)
// ---------------------------------------------------------------------------
export class CommonNetworkDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(7)
  mobile!: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  categoryType?: string;

  @IsOptional()
  @IsString()
  wardNumber?: string;

  @IsOptional()
  @IsString()
  boothNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  politicalInfluenceLevel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  publicReach?: number;

  @IsOptional()
  @IsString()
  assignedArea?: string;

  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  reportingPersonId?: string;
}

// ---------------------------------------------------------------------------
// Committee (definition)
// ---------------------------------------------------------------------------
export class CreateCommitteeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(CommitteeCategory)
  category!: CommitteeCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;

  @IsOptional()
  @IsString()
  mandalId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;
}

export class UpdateCommitteeDto extends CreateCommitteeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsOptional()
  @IsEnum(CommitteeCategory)
  declare category: CommitteeCategory;
}

// ---------------------------------------------------------------------------
// Committee member
// ---------------------------------------------------------------------------
export class CreateCommitteeMemberDto extends CommonNetworkDto {
  @IsOptional()
  @IsEnum(CommitteeCategory)
  category?: CommitteeCategory;

  @IsOptional()
  @IsString()
  committeeId?: string;

  @IsOptional()
  @IsString()
  committeeName?: string;

  @IsOptional()
  @IsString()
  committeeRole?: string;

  @IsOptional()
  @IsString()
  partyPosition?: string;

  @IsOptional()
  @Type(() => Date)
  joiningDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  attendanceCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  taskCompletionScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  volunteerStrength?: number;

  @IsOptional()
  @IsString()
  boothResponsibility?: string;
}

export class UpdateCommitteeMemberDto extends CreateCommitteeMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;
}

// ---------------------------------------------------------------------------
// Observer
// ---------------------------------------------------------------------------
export class CreateObserverDto extends CommonNetworkDto {
  @IsOptional()
  @IsString()
  observationArea?: string;

  @IsOptional()
  @IsString()
  assignedMandals?: string;

  @IsOptional()
  @IsString()
  reportingFrequency?: string;

  @IsOptional()
  @IsString()
  performanceRemarks?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  issueEscalationCount?: number;
}

export class UpdateObserverDto extends CreateObserverDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;
}

// ---------------------------------------------------------------------------
// IMP leader
// ---------------------------------------------------------------------------
export class CreateImpLeaderDto extends CommonNetworkDto {
  @IsOptional()
  @IsString()
  influenceArea?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  communityReach?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  voterInfluenceScore?: number;

  @IsOptional()
  @IsString()
  keySupportGroups?: string;

  @IsOptional()
  @IsString()
  priorityLevel?: string;
}

export class UpdateImpLeaderDto extends CreateImpLeaderDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;
}

// ---------------------------------------------------------------------------
// Influencer
// ---------------------------------------------------------------------------
export class CreateInfluencerDto extends CommonNetworkDto {
  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  instagramFollowers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  facebookFollowers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  youtubeSubscribers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  twitterFollowers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  engagementRate?: number;

  @IsOptional()
  @IsString()
  contentCategory?: string;

  @IsOptional()
  @IsString()
  politicalAlignment?: string;

  @IsOptional()
  @IsString()
  collaborationStatus?: string;
}

export class UpdateInfluencerDto extends CreateInfluencerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;
}

// ---------------------------------------------------------------------------
// Press contact
// ---------------------------------------------------------------------------
export class CreatePressDto extends CommonNetworkDto {
  @IsOptional()
  @IsString()
  mediaHouseName?: string;

  @IsOptional()
  @IsEnum(JournalistType)
  journalistType?: JournalistType;

  @IsOptional()
  @IsString()
  beat?: string;

  @IsOptional()
  @IsString()
  districtCoverage?: string;

  @IsOptional()
  @IsString()
  mandalCoverage?: string;

  @IsOptional()
  @IsString()
  pressId?: string;

  @IsOptional()
  @IsString()
  relationshipStatus?: string;

  @IsOptional()
  @Type(() => Date)
  lastInteractionDate?: Date;
}

export class UpdatePressDto extends CreatePressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  declare mobile: string;
}

// ---------------------------------------------------------------------------
// Activity log + CSV import
// ---------------------------------------------------------------------------
export class AddActivityDto {
  @IsString()
  @MinLength(2)
  action!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  byName?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;
}

export class ImportCsvDto {
  @IsString()
  csv!: string;
}

export const NETWORK_ENTITY_TYPES = NetworkEntityType;

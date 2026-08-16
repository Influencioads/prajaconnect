import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const INVITATION_CATEGORIES = ['Wedding', 'Function', 'Opening', 'Festival', 'Other'] as const;
export const INVITATION_DECISIONS = ['Pending', 'Attend', 'SendRepresentative', 'SendWishes', 'Decline'] as const;

export class CreateInvitationDto {
  @IsString()
  @MinLength(2)
  eventName!: string;

  @IsString()
  @MinLength(2)
  host!: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  cardPhotoUrl?: string;

  @IsOptional()
  @IsIn(INVITATION_CATEGORIES as unknown as string[])
  category?: string;

  @IsOptional()
  @IsString()
  giftNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvitationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  eventName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  host?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  cardPhotoUrl?: string;

  @IsOptional()
  @IsIn(INVITATION_CATEGORIES as unknown as string[])
  category?: string;

  @IsOptional()
  @IsString()
  giftNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  wishSent?: boolean;
}

export class InvitationDecisionDto {
  @IsIn(INVITATION_DECISIONS as unknown as string[])
  decision!: string;

  @IsOptional()
  @IsString()
  cadreId?: string;

  @IsOptional()
  @IsString()
  giftNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvitationQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(INVITATION_DECISIONS as unknown as string[])
  decision?: string;

  @IsOptional()
  @IsIn(INVITATION_CATEGORIES as unknown as string[])
  category?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

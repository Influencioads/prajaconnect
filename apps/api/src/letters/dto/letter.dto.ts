import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const LETTER_TYPES = ['department', 'condolence', 'congratulation', 'recommendation', 'other'];
export const LETTER_STATUSES = ['Draft', 'Final', 'Issued'];

export class LetterQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(LETTER_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(LETTER_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class CreateLetterDto {
  @IsIn(LETTER_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(10)
  body!: string;

  @IsOptional()
  @IsString()
  bodyTe?: string;

  @IsString()
  @MinLength(2)
  addresseeName!: string;

  @IsOptional()
  @IsString()
  addresseeDesignation?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  officialId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;
}

export class UpdateLetterDto {
  @IsOptional()
  @IsIn(LETTER_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  body?: string;

  @IsOptional()
  @IsString()
  bodyTe?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  addresseeName?: string;

  @IsOptional()
  @IsString()
  addresseeDesignation?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  officialId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;
}

export class DraftLetterDto {
  @IsIn(LETTER_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  points!: string[];

  @IsString()
  @MinLength(2)
  addresseeName!: string;

  @IsOptional()
  @IsString()
  addresseeDesignation?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  officialId?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  grievanceId?: string;
}

export class SendLetterDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['email', 'whatsapp'], { each: true })
  channels!: ('email' | 'whatsapp')[];

  @IsOptional()
  @IsString()
  emailTo?: string;

  @IsOptional()
  @IsString()
  whatsappTo?: string;
}

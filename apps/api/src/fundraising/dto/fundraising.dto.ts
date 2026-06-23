import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMode } from '@praja/database';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class DonationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  donorId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}

export class CreateDonorDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateDonorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateDonationDto {
  @IsString()
  donorId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDonationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateEventDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;
}

export class CreateFollowUpDto {
  @IsString()
  donorId!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFollowUpDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}

export class FollowUpQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  donorId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}

export class CreateCommunicationDto {
  @IsString()
  donorId!: string;

  @IsString()
  channel!: string;

  @IsString()
  message!: string;
}

export class UpdateCommunicationDto {
  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class CommunicationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  donorId?: string;
}

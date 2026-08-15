import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @MinLength(2)
  milestone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentComplete!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Pre-uploaded photo URL (alternative to the multipart "file" field). */
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

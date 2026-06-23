import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or mobile

  @IsString()
  @MinLength(4)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

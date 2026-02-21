// src/auth/dto/register.dto.ts
import { IsNotEmpty, IsString, IsEmail, MinLength, MaxLength, IsOptional, IsObject } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50)
  password: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsObject()
  @IsNotEmpty()
  birthday: {
    month: string;
    day: string;
    year: string;
  };

  @IsString()
  @IsOptional()
  profilePicture?: string;
}
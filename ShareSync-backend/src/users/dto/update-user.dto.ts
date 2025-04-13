import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  hobbies?: string[];

  @IsOptional()
  skills?: string[];

  @IsOptional()
  experience?: string[];

  @IsOptional()
  endorsements?: string[];

  @IsOptional()
  following?: string[];

  @IsOptional()
  followers?: string[];

  @IsOptional()
  points?: number;

  @IsOptional()
  badges?: string[];
}
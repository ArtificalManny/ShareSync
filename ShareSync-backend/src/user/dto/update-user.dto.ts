import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';

/**
 * Keep this DTO permissive to avoid breaking existing PATCH clients.
 * We only validate basic primitives; complex nested objects use IsObject.
 */
export class UpdateUserDto {
  // ─────────────────────────────────────────────
  // Basic identity
  // ─────────────────────────────────────────────
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // ─────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  bannerPicture?: string;

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  // ─────────────────────────────────────────────
  // Backward-compat fields you already had
  // ─────────────────────────────────────────────
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
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsArray()
  badges?: string[];

  // ─────────────────────────────────────────────
  // Preferences (NEW)
  // We keep this as IsObject to avoid over-validating in early phases.
  // ─────────────────────────────────────────────
  @IsOptional()
  @IsObject()
  preferences?: any;
}

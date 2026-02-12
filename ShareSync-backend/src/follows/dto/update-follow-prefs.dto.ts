// src/follows/dto/update-follow-prefs.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DTO: Update Follow Preferences
// Optional PATCH for updating channelPrefs/frequency after follow.
// Safe, additive, and backwards compatible.
// ═══════════════════════════════════════════════════════════════════════════════

import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { FollowFrequency } from '../schemas/project-follow.schema';

export class UpdateFollowPrefsDto {
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsEnum(FollowFrequency)
  frequency?: FollowFrequency;
}

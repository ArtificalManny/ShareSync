// src/follows/dto/follow-project.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DTO: Follow Project
// ═══════════════════════════════════════════════════════════════════════════════

import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { FollowFrequency } from '../schemas/project-follow.schema';

export class FollowProjectDto {
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

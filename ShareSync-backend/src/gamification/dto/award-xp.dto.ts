// src/gamification/dto/award-xp.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AWARD XP DTO
// - Safe "generic XP award" payload for manual awards & non-task events.
// - Designed to preserve forward compatibility without forcing schema changes.
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AwardXpDto {
  @ApiProperty({
    description: 'XP amount to award (positive integer recommended)',
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(1000000)
  amount: number;

  @ApiProperty({
    description:
      'Source key for the XP award (e.g., task_complete, badge_earned, focus_session, manual, import)',
    example: 'manual',
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    description: 'Optional source entity ID (taskId, projectId, badgeId, etc.)',
    example: '65f3b6c2b2a2a2a2a2a2a2a2',
  })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Optional human-readable description for audit/history',
    example: 'Awarded XP for completing onboarding steps',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional multiplier applied client-side or via upstream logic',
    example: 1.5,
  })
  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @ApiPropertyOptional({
    description: 'Mark this award as a bonus event',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isBonus?: boolean;

  @ApiPropertyOptional({
    description: 'Mark this award as legendary (rare/high-signal event)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLegendary?: boolean;

  @ApiPropertyOptional({
    description:
      'Flexible metadata bag for future expansions (projectId, taskId, ceremony, breakdown, etc.)',
    example: { projectId: '...', taskId: '...', reason: 'promo' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

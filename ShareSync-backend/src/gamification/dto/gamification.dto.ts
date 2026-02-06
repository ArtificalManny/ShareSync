// src/gamification/dto/gamification.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';
import { BadgeCategory, BadgeRarity } from '../constants/badges.constants';
import { HallOfFameCategory } from '../schemas/hall-of-fame.schema';
import { CeremonyType } from '../schemas/ceremony.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// XP DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AwardXPDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;
}

export class TaskCompletionXPDto {
  @ApiProperty()
  @IsMongoId()
  taskId: string;

  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsString()
  priority: 'low' | 'medium' | 'high' | 'critical';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBlocking?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOnTime?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEarly?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  inFocusMode?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class UseStreakFreezeDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: ['all_time', 'weekly', 'monthly', 'streak'] })
  @IsString()
  @IsOptional()
  type?: 'all_time' | 'weekly' | 'monthly' | 'streak';

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class BadgeQueryDto {
  @ApiPropertyOptional({ enum: BadgeCategory })
  @IsEnum(BadgeCategory)
  @IsOptional()
  category?: BadgeCategory;

  @ApiPropertyOptional({ enum: BadgeRarity })
  @IsEnum(BadgeRarity)
  @IsOptional()
  rarity?: BadgeRarity;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  earnedOnly?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeHidden?: boolean;
}

export class ShowcaseBadgeDto {
  @ApiProperty()
  @IsString()
  badgeId: string;

  @ApiProperty()
  @IsBoolean()
  showcase: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HALL OF FAME DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class HallOfFameQueryDto {
  @ApiPropertyOptional({ enum: HallOfFameCategory })
  @IsEnum(HallOfFameCategory)
  @IsOptional()
  category?: HallOfFameCategory;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  featuredOnly?: boolean;
}

export class CelebrateDto {
  @ApiProperty()
  @IsMongoId()
  entryId: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CeremonyTriggerDto {
  @ApiProperty({ enum: CeremonyType })
  @IsEnum(CeremonyType)
  type: CeremonyType;

  @ApiProperty()
  @IsNumber()
  xpAwarded: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  bonusXP?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLegendary?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  multiplier?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  context?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class XPGainResponseDto {
  @ApiProperty()
  xpGained: number;

  @ApiProperty()
  totalXP: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelProgress: number;

  @ApiPropertyOptional()
  leveledUp?: boolean;

  @ApiPropertyOptional()
  newLevel?: number;

  @ApiPropertyOptional()
  bonusAwarded?: number;

  @ApiPropertyOptional()
  isLegendary?: boolean;

  @ApiPropertyOptional()
  multiplier?: number;

  @ApiProperty()
  ceremony: {
    tier: string;
    animation: string;
    sound: string;
    duration: number;
  };
}

export class UserStatsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalXP: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelProgress: number;

  @ApiProperty()
  levelTitle: string;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  longestStreak: number;

  @ApiProperty()
  totalTasksCompleted: number;

  @ApiProperty()
  badgeCount: number;

  @ApiProperty()
  todayXP: number;

  @ApiProperty()
  weeklyXP: number;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  level: number;
}

export class BadgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ enum: BadgeCategory })
  category: BadgeCategory;

  @ApiProperty({ enum: BadgeRarity })
  rarity: BadgeRarity;

  @ApiProperty()
  xpReward: number;

  @ApiProperty()
  isEarned: boolean;

  @ApiPropertyOptional()
  earnedAt?: Date;

  @ApiPropertyOptional()
  progress?: number;
}

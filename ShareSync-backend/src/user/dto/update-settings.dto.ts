// src/user/dto/update-settings.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE SETTINGS DTO - Settings page form validation
// Phase 7: Profile System
// ═══════════════════════════════════════════════════════════════════════════════

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  IsNumber,
  IsEmail,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class UpdateSettingsDto {
  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE FIELDS
  // ─────────────────────────────────────────────────────────────────────────────

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
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  website?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATION SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  notificationSettings?: {
    emailDigest?: boolean;
    pushNotifications?: boolean;
    mentionAlerts?: boolean;
    weeklyReport?: boolean;
    emailActivity?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVACY SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  privacySettings?: {
    profilePublic?: boolean;
    showActivity?: boolean;
    allowDMs?: boolean;
  };

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  discoverable?: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // APPEARANCE SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  appearance?: {
    theme?: 'system' | 'light' | 'dark';
    mode?: 'kid' | 'pro';
    accentColor?: string;
    animations?: boolean;
    sounds?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MENTOR SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  mentor?: {
    enabled?: boolean;
    tone?: 'kind' | 'wise' | 'drill';
    intensity?: number;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOMENTUM SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  momentum?: {
    dailyGoal?: number;
    weekendCount?: boolean;
    allowFreeze?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FOCUS SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  focus?: {
    dailyTarget?: number;
    autoStart?: boolean;
    startTime?: string;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SOCIAL SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  social?: {
    showStreakTo?: 'nobody' | 'friends' | 'everyone';
    celebrate?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  legacy?: {
    showEverywhere?: boolean;
    yearlyVideo?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  security?: {
    twoFA?: boolean;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PREFERENCES (catch-all for nested preferences)
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsObject()
  preferences?: any;
}

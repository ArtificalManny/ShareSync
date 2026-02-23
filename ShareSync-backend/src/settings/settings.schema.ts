// src/settings/settings.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS SCHEMA - Comprehensive user settings storage
// Phase 6: Full settings support matching frontend Settings.jsx
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class MomentumSettings {
  @Prop({ type: Number, default: 5, min: 1, max: 10 })
  dailyGoal: number;

  @Prop({ type: Boolean, default: true })
  weekendCount: boolean;

  @Prop({ type: Boolean, default: true })
  allowFreeze: boolean;

  @Prop({ type: Number, default: 0 })
  freezesUsedThisMonth: number;

  @Prop({ type: Date })
  lastFreezeUsedAt?: Date;
}

export const MomentumSettingsSchema = SchemaFactory.createForClass(MomentumSettings);

@Schema({ _id: false })
export class FocusSettings {
  @Prop({ type: Number, default: 4, min: 1, max: 8 })
  dailyTarget: number;

  @Prop({ type: Boolean, default: false })
  autoStart: boolean;

  @Prop({ type: String, default: '09:00' })
  startTime: string;

  @Prop({ type: [String], default: [] })
  blockedApps: string[];

  @Prop({ type: Number, default: 1 })
  emergencyBreaksLeft: number;
}

export const FocusSettingsSchema = SchemaFactory.createForClass(FocusSettings);

@Schema({ _id: false })
export class SocialSettings {
  @Prop({ type: String, enum: ['nobody', 'friends', 'everyone'], default: 'friends' })
  showStreakTo: string;

  @Prop({ type: Boolean, default: true })
  celebrate: boolean;

  @Prop({ type: Boolean, default: true })
  publicProfile: boolean;

  @Prop({ type: Boolean, default: false })
  discoverable: boolean;

  @Prop({ type: Boolean, default: true })
  allowDMs: boolean;

  @Prop({ type: Boolean, default: true })
  showActivity: boolean;
}

export const SocialSettingsSchema = SchemaFactory.createForClass(SocialSettings);

@Schema({ _id: false })
export class MentorSettings {
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: String, enum: ['kind', 'wise', 'drill'], default: 'wise' })
  tone: string;

  @Prop({ type: Number, default: 3, min: 1, max: 5 })
  intensity: number;
}

export const MentorSettingsSchema = SchemaFactory.createForClass(MentorSettings);

@Schema({ _id: false })
export class LegacySettings {
  @Prop({ type: Boolean, default: true })
  showEverywhere: boolean;

  @Prop({ type: Boolean, default: false })
  yearlyVideo: boolean;
}

export const LegacySettingsSchema = SchemaFactory.createForClass(LegacySettings);

@Schema({ _id: false })
export class AppearanceSettings {
  @Prop({ type: String, enum: ['system', 'light', 'dark'], default: 'system' })
  theme: string;

  @Prop({ type: String, enum: ['kid', 'pro'], default: 'pro' })
  mode: string;

  @Prop({ type: String })
  accentColor?: string;

  @Prop({ type: Boolean, default: true })
  animations: boolean;

  @Prop({ type: Boolean, default: true })
  sounds: boolean;
}

export const AppearanceSettingsSchema = SchemaFactory.createForClass(AppearanceSettings);

@Schema({ _id: false })
export class NotificationSettings {
  @Prop({ type: Boolean, default: true })
  emailActivity: boolean;

  @Prop({ type: Boolean, default: true })
  emailDigest: boolean;

  @Prop({ type: Boolean, default: true })
  pushNotifications: boolean;

  @Prop({ type: Boolean, default: true })
  mentionAlerts: boolean;

  @Prop({ type: Boolean, default: true })
  weeklyReport: boolean;

  @Prop({ type: Boolean, default: true })
  shipCelebrations: boolean;

  @Prop({ type: Boolean, default: true })
  streakReminders: boolean;

  @Prop({ type: String, enum: ['none', 'daily', 'weekly'], default: 'daily' })
  digestFrequency: string;
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);

@Schema({ _id: false })
export class SecuritySettings {
  @Prop({ type: Boolean, default: false })
  twoFA: boolean;

  @Prop({ type: String })
  twoFASecret?: string;

  @Prop({ type: [String], default: [] })
  trustedDevices: string[];

  @Prop({ type: Date })
  lastPasswordChange?: Date;

  @Prop({ type: [String], default: [] })
  loginHistory: string[];
}

export const SecuritySettingsSchema = SchemaFactory.createForClass(SecuritySettings);

@Schema({ _id: false })
export class PrivacySettings {
  @Prop({ type: Boolean, default: true })
  profilePublic: boolean;

  @Prop({ type: Boolean, default: true })
  showActivity: boolean;

  @Prop({ type: Boolean, default: true })
  allowDMs: boolean;

  @Prop({ type: Boolean, default: false })
  hideFromSearch: boolean;

  @Prop({ type: Boolean, default: false })
  anonymousMode: boolean;
}

export const PrivacySettingsSchema = SchemaFactory.createForClass(PrivacySettings);

@Schema({ _id: false })
export class PresenceSettings {
  @Prop({ type: Boolean, default: true })
  showCursor: boolean;

  @Prop({ type: Boolean, default: true })
  showOnlineStatus: boolean;

  @Prop({ type: Boolean, default: true })
  showTypingIndicator: boolean;

  @Prop({ type: String, default: '#7C3AED' })
  cursorColor: string;
}

export const PresenceSettingsSchema = SchemaFactory.createForClass(PresenceSettings);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type SettingsDocument = Settings & Document;

@Schema({
  timestamps: true,
  collection: 'settings',
})
export class Settings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // NESTED SETTINGS OBJECTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: MomentumSettingsSchema, default: () => ({}) })
  momentum: MomentumSettings;

  @Prop({ type: FocusSettingsSchema, default: () => ({}) })
  focus: FocusSettings;

  @Prop({ type: SocialSettingsSchema, default: () => ({}) })
  social: SocialSettings;

  @Prop({ type: MentorSettingsSchema, default: () => ({}) })
  mentor: MentorSettings;

  @Prop({ type: LegacySettingsSchema, default: () => ({}) })
  legacy: LegacySettings;

  @Prop({ type: AppearanceSettingsSchema, default: () => ({}) })
  appearance: AppearanceSettings;

  @Prop({ type: NotificationSettingsSchema, default: () => ({}) })
  notifications: NotificationSettings;

  @Prop({ type: SecuritySettingsSchema, default: () => ({}) })
  security: SecuritySettings;

  @Prop({ type: PrivacySettingsSchema, default: () => ({}) })
  privacy: PrivacySettings;

  @Prop({ type: PresenceSettingsSchema, default: () => ({}) })
  presence: PresenceSettings;

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY FLAT FIELDS (for backwards compatibility)
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Boolean, default: true })
  emailNotifications: boolean;

  @Prop({ type: Boolean, default: true })
  pushNotifications: boolean;

  @Prop({ type: Boolean, default: true })
  publicProfile: boolean;

  @Prop({ type: Boolean, default: false })
  discoverable: boolean;

  @Prop({ type: String, default: 'America/Los_Angeles' })
  timezone: string;

  @Prop({ type: String })
  language?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Object, default: {} })
  experiments: Record<string, any>;

  @Prop({ type: Date })
  lastSettingsUpdate?: Date;

  // Timestamps (auto-managed)
  createdAt: Date;
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

SettingsSchema.index({ userId: 1 }, { unique: true });

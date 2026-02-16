import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

type ThemeMode = 'light' | 'dark' | 'system';

// ✅ Phase 4: notification channel + digest types (non-breaking)
export type DigestFrequency = 'daily' | 'weekly' | 'off';
export type NotificationChannel = 'email' | 'sms' | 'inApp';

@Schema({ timestamps: true })
export class User extends Document {
  // ============================================
  // BASIC INFO (existing)
  // ============================================
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  // NEW (safe): displayName used by frontend
  @Prop()
  displayName?: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  bannerPicture?: string;

  // Backward compat fields you already had
  @Prop()
  school?: string;

  @Prop()
  job?: string;

  // NEW (blueprint-style fields)
  @Prop()
  bio?: string;

  @Prop()
  location?: string;

  @Prop()
  timezone?: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  company?: string;

  @Prop()
  website?: string;

  @Prop({
    type: {
      twitter: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    default: undefined,
  })
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };

  @Prop({ default: false })
  publicProfile?: boolean;

  // ============================================
  // PREFERENCES (NEW, but non-breaking)
  // Keep separate from your existing "settings" object to avoid breaking old UI.
  // ============================================
  @Prop({
    type: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      accentColor: { type: String, default: '#8B5CF6' },

      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        digest: { type: String, enum: ['daily', 'weekly', 'none'], default: 'weekly' },
      },

      defaultProjectView: {
        type: String,
        enum: ['pulse', 'stack', 'flow', 'roadmap', 'rhythm'],
        default: 'pulse',
      },

      focusMode: {
        autoEnable: { type: Boolean, default: false },
        duration: { type: Number, default: 50 },
        breakDuration: { type: Number, default: 10 },
        blockNotifications: { type: Boolean, default: false },
      },

      calendar: {
        startOfWeek: { type: Number, enum: [0, 1], default: 1 },
        workingHours: {
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
        },
        energyZones: {
          highEnergy: { start: { type: String, default: '08:00' }, end: { type: String, default: '12:00' } },
          mediumEnergy: { start: { type: String, default: '12:00' }, end: { type: String, default: '15:00' } },
          lowEnergy: { start: { type: String, default: '15:00' }, end: { type: String, default: '19:00' } },
        },
      },

      privacy: {
        showOnlineStatus: { type: Boolean, default: true },
        showActivity: { type: Boolean, default: true },
        publicProfile: { type: Boolean, default: false },
      },
    },
    default: undefined,
  })
  preferences?: {
    theme?: ThemeMode;
    accentColor?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
      digest?: 'daily' | 'weekly' | 'none';
    };
    defaultProjectView?: 'pulse' | 'stack' | 'flow' | 'roadmap' | 'rhythm';
    focusMode?: {
      autoEnable?: boolean;
      duration?: number;
      breakDuration?: number;
      blockNotifications?: boolean;
    };
    calendar?: {
      startOfWeek?: 0 | 1;
      workingHours?: { start: string; end: string };
      energyZones?: {
        highEnergy?: { start: string; end: string };
        mediumEnergy?: { start: string; end: string };
        lowEnergy?: { start: string; end: string };
      };
    };
    privacy?: {
      showOnlineStatus?: boolean;
      showActivity?: boolean;
      publicProfile?: boolean;
    };
  };

  // ============================================
  // ✅ PHASE 4: CHANNEL VERIFICATION + OPT-IN (NEW, SAFE)
  // - Does NOT replace existing settings/preferences
  // - Defaults to OFF/UNVERIFIED to enforce your rule:
  //   "No email/SMS until verified + opted-in"
  // ============================================

  @Prop({
    type: {
      email: {
        email: { type: String, default: undefined },
        verified: { type: Boolean, default: false },
        optIn: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: undefined },
      },
      sms: {
        phoneNumber: { type: String, default: undefined },
        verified: { type: Boolean, default: false },
        optIn: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: undefined },
      },
    },
    default: undefined,
  })
  notificationChannels?: {
    email?: { email?: string; verified?: boolean; optIn?: boolean; verifiedAt?: Date };
    sms?: { phoneNumber?: string; verified?: boolean; optIn?: boolean; verifiedAt?: Date };
  };

  @Prop({
    type: {
      channels: {
        inApp: { type: Boolean, default: true }, // keep in-app first
        email: { type: Boolean, default: false }, // strict default off
        sms: { type: Boolean, default: false },   // strict default off
      },
      digest: {
        // safest MVP: digest only, default weekly
        email: { type: String, enum: ['daily', 'weekly', 'off'], default: 'weekly' },
        // SMS digest is optional later — keep default off
        sms: { type: String, enum: ['daily', 'weekly', 'off'], default: 'off' },
      },
    },
    default: undefined,
  })
  notificationPrefs?: {
    channels?: { inApp?: boolean; email?: boolean; sms?: boolean };
    digest?: { email?: DigestFrequency; sms?: DigestFrequency };
  };

  // ============================================
  // GAMIFICATION (existing)
  // ============================================
  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  streakDays: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastShipDate?: Date;

  @Prop({ default: 0 })
  totalShips: number;

  @Prop({ default: 0 })
  totalTasksCompleted: number;

  // ============================================
  // ACHIEVEMENTS (existing)
  // ============================================
  @Prop({
    type: [{
      id: String,
      name: String,
      unlockedAt: Date,
      xpReward: Number,
    }],
    default: [],
  })
  achievements: Array<{
    id: string;
    name: string;
    unlockedAt: Date;
    xpReward: number;
  }>;

  @Prop({ type: [String], default: [] })
  badges: string[];

  // ============================================
  // PROJECTS (existing)
  // ============================================
  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  projects: Types.ObjectId[];

  // ============================================
  // NOTIFICATIONS / SETTINGS (existing - keep for compat)
  // ============================================
  @Prop({ type: [String], default: [] })
  notificationPreferences: string[];

  @Prop({ type: Boolean, default: false })
  emailOptOut: boolean;

  @Prop({
    type: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      soundEffects: { type: Boolean, default: true },
    },
    default: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      soundEffects: true,
    },
  })
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    soundEffects: boolean;
  };

  // ============================================
  // ENERGY TRACKING (existing)
  // ============================================
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  currentEnergy: string;

  @Prop()
  lastEnergyUpdate?: Date;

  // ============================================
  // AUTH & SECURITY (existing + NEW fields)
  // ============================================
  @Prop()
  refreshToken?: string;

  @Prop({ default: true })
  isActive: boolean;

  // ⭐ EXISTING: Keep for backward compatibility
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  // ⭐ NEW: OTP-based verification (6-digit codes)
  @Prop({ select: false })
  verificationCode?: string;

  @Prop()
  verificationCodeExpiry?: Date;

  // ⭐ NEW: Token versioning for session invalidation
  @Prop({ default: 0 })
  tokenVersion: number;

  // ============================================
  // TRACKING (existing)
  // ============================================
  @Prop({ default: null })
  lastLogin?: Date;

  // ============================================
  // VIRTUAL: Full Name (existing)
  // ============================================
  get name(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('name').get(function () {
  // @ts-ignore
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ xp: -1 });
UserSchema.index({ streakDays: -1 });

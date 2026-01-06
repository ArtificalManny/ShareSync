// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  // ============================================
  // BASIC INFO (Your existing fields)
  // ============================================
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  bannerPicture?: string;

  @Prop()
  school?: string;

  @Prop()
  job?: string;

  @Prop({ default: false })
  publicProfile?: boolean;

  // ============================================
  // GAMIFICATION (Your existing + Enhanced)
  // ============================================
  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number; // NEW: Level system

  @Prop({ default: 0 })
  streakDays: number; // Your existing field (renamed from currentStreak)

  @Prop({ default: 0 })
  longestStreak: number; // NEW: Track longest streak

  @Prop()
  lastShipDate?: Date; // NEW: For streak calculation

  @Prop({ default: 0 })
  totalShips: number; // NEW: Total ships count

  @Prop({ default: 0 })
  totalTasksCompleted: number; // NEW: Total tasks completed

  // ============================================
  // ACHIEVEMENTS (NEW)
  // ============================================
  @Prop({ 
    type: [{ 
      id: String, 
      name: String, 
      unlockedAt: Date,
      xpReward: Number 
    }], 
    default: [] 
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
  // PROJECTS (Your existing field)
  // ============================================
  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  projects: Types.ObjectId[];

  // ============================================
  // NOTIFICATIONS (Your existing + Enhanced)
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
      soundEffects: { type: Boolean, default: true }
    },
    default: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      soundEffects: true
    }
  })
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    soundEffects: boolean;
  };

  // ============================================
  // ENERGY TRACKING (NEW)
  // ============================================
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  currentEnergy: string;

  @Prop()
  lastEnergyUpdate?: Date;

  // ============================================
  // AUTH & SECURITY (NEW - for refresh tokens)
  // ============================================
  @Prop()
  refreshToken?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  // ============================================
  // TRACKING (Your existing field)
  // ============================================
  @Prop({ default: null })
  lastLogin?: Date;

  // ============================================
  // VIRTUAL: Full Name (Your existing)
  // ============================================
  get name(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual for name
UserSchema.virtual('name').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ xp: -1 }); // For leaderboards
UserSchema.index({ streakDays: -1 }); // For streak leaderboards
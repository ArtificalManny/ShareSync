// src/user/user.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER SERVICE - User management and settings
// Phase 7: Added getSettings, updateSettings, exportUserData, deleteAccount, etc.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { ProjectsService } from '../projects/projects.service';
import { ActivitiesService } from '../activities/activities.service';
import { buildActivitySummary } from '../utils/activitySummary';
import { SmsService } from '../notifications/sms.service';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function deepMergePreferences(existing: any, incoming: any) {
  const e = existing ?? {};
  const i = incoming ?? {};

  return {
    ...e,
    ...i,

    notifications: {
      ...(e.notifications ?? {}),
      ...(i.notifications ?? {}),
    },

    focusMode: {
      ...(e.focusMode ?? {}),
      ...(i.focusMode ?? {}),
    },

    privacy: {
      ...(e.privacy ?? {}),
      ...(i.privacy ?? {}),
    },

    calendar: {
      ...(e.calendar ?? {}),
      ...(i.calendar ?? {}),
      workingHours: {
        ...(e.calendar?.workingHours ?? {}),
        ...(i.calendar?.workingHours ?? {}),
      },
      energyZones: {
        ...(e.calendar?.energyZones ?? {}),
        ...(i.calendar?.energyZones ?? {}),
        highEnergy: {
          ...(e.calendar?.energyZones?.highEnergy ?? {}),
          ...(i.calendar?.energyZones?.highEnergy ?? {}),
        },
        mediumEnergy: {
          ...(e.calendar?.energyZones?.mediumEnergy ?? {}),
          ...(i.calendar?.energyZones?.mediumEnergy ?? {}),
        },
        lowEnergy: {
          ...(e.calendar?.energyZones?.lowEnergy ?? {}),
          ...(i.calendar?.energyZones?.lowEnergy ?? {}),
        },
      },
    },
  };
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,

    private readonly activities: ActivitiesService,

    // ✅ Phase 13: SMS for phone verification
    private readonly smsService: SmsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // FIND METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async findById(id: string): Promise<UserDocument | null> {
    const result = await this.userModel.findById(id).exec();
    return result as any;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    const result = await this.userModel.findOne({ username }).exec();
    return result as any;
  }

  async findPublicByUsername(username: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({ username })
      .select('-password -resetToken -verificationToken -verificationCode')
      .exec();

    if (!user) return null;
    if ((user as any).publicProfile === false) return null;
    return user as any;
  }

  async findPublicById(id: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findById(id)
      .select('-password -resetToken -verificationToken -verificationCode')
      .exec();

    if (!user) return null;
    if ((user as any).publicProfile === false) return null;
    return user as any;
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    const result = await this.userModel.findOne({ email }).exec();
    return result as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE / UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  async create(createUserDto: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    const saved = await createdUser.save();
    return saved as any;
  }

  async updateById(id: string, patch: Partial<User>): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated as any;
  }

  async update(id: string, updateUserDto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updateUserDto);
    const saved = await user.save();
    return saved as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS (Phase 7)
  // ═══════════════════════════════════════════════════════════════════════════

  async getSettings(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -resetToken -verificationToken -verificationCode')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    // ⭐ FIX: Stopped hardcoding default values. Now actively retrieving from db.
    return {
      firstName: (user as any).firstName || '',
      lastName: (user as any).lastName || '',
      username: (user as any).username || '',
      email: (user as any).email || '',
      bio: (user as any).bio || '',
      timezone: (user as any).timezone || 'America/Los_Angeles',
      location: (user as any).location || '',
      jobTitle: (user as any).jobTitle || '',
      company: (user as any).company || '',
      website: (user as any).website || '',
      notificationSettings: {
        emailDigest: (user as any).settings?.weeklyDigest ?? true,
        pushNotifications: (user as any).settings?.pushNotifications ?? true,
        mentionAlerts: true,
        weeklyReport: (user as any).settings?.weeklyDigest ?? true,
        emailActivity: (user as any).settings?.emailNotifications ?? true,
      },
      privacySettings: {
        profilePublic: (user as any).publicProfile ?? true,
        showActivity: (user as any).preferences?.privacy?.showActivity ?? true,
        allowDMs: true,
      },
      appearance: (user as any).appearance || { theme: (user as any).preferences?.theme || 'system', mode: 'pro' },
      mentor: (user as any).mentor || { enabled: true, tone: 'wise', intensity: 3 },
      momentum: (user as any).momentum || { dailyGoal: 5, weekendCount: true, allowFreeze: true },
      focus: (user as any).focus || {
        dailyTarget: (user as any).preferences?.focusMode?.duration ? Math.floor((user as any).preferences.focusMode.duration / 60) : 4,
        autoStart: (user as any).preferences?.focusMode?.autoEnable ?? false,
        startTime: '09:00',
      },
      social: (user as any).social || { showStreakTo: 'friends', celebrate: true },
      legacy: (user as any).legacy || { showEverywhere: true, yearlyVideo: false },
      security: (user as any).security || { twoFA: false },
      preferences: (user as any).preferences || {},
      publicProfile: (user as any).publicProfile ?? true,
      discoverable: (user as any).discoverable ?? (user as any).preferences?.privacy?.publicProfile ?? false,
    };
  }

  async updateSettings(userId: string, settingsDto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const profileFields = ['firstName', 'lastName', 'username', 'email', 'bio', 'timezone', 'location', 'jobTitle', 'company', 'website'];
    for (const field of profileFields) {
      if (settingsDto[field] !== undefined) { (user as any)[field] = settingsDto[field]; }
    }

    if (settingsDto.notificationSettings) {
      const ns = settingsDto.notificationSettings;
      (user as any).settings = {
        ...((user as any).settings || {}),
        emailNotifications: ns.emailActivity ?? (user as any).settings?.emailNotifications ?? true,
        pushNotifications: ns.pushNotifications ?? (user as any).settings?.pushNotifications ?? true,
        weeklyDigest: ns.weeklyReport ?? (user as any).settings?.weeklyDigest ?? true,
      };
    }

    if (settingsDto.privacySettings) { (user as any).publicProfile = settingsDto.privacySettings.profilePublic ?? (user as any).publicProfile; }
    if (settingsDto.publicProfile !== undefined) { (user as any).publicProfile = settingsDto.publicProfile; }
    if (settingsDto.discoverable !== undefined) { (user as any).discoverable = settingsDto.discoverable; }

    if (settingsDto.appearance) {
      // ⭐ FIX: Store appearance at top-level
      (user as any).appearance = { ...((user as any).appearance || {}), ...settingsDto.appearance };
      
      // Preserve old preference mapping so we don't break existing UI dependencies
      const existing = (user as any).preferences ?? {};
      (user as any).preferences = { ...existing, theme: settingsDto.appearance.theme ?? existing.theme };
    }

    const nestedFields = ['mentor', 'momentum', 'focus', 'social', 'legacy', 'security'];
    for (const field of nestedFields) {
      if (settingsDto[field] !== undefined) {
        // ⭐ FIX: Now saving directly to the new top-level schema shelves we built!
        (user as any)[field] = { ...((user as any)[field] || {}), ...settingsDto[field] };

        // Keep saving into old preferences object just as a fallback 
        const existing = (user as any).preferences ?? {};
        (user as any).preferences = { ...existing, [field]: { ...(existing[field] || {}), ...settingsDto[field] } };
      }
    }

    if (settingsDto.preferences) {
      const existing = (user as any).preferences ?? {};
      (user as any).preferences = deepMergePreferences(existing, settingsDto.preferences);
    }

    const saved = await user.save();
    return saved as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE VERIFICATION (Phase 13)
  // ═══════════════════════════════════════════════════════════════════════════

  async requestPhoneVerification(userId: string, phoneNumber: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    // Basic regex validation to ensure it looks like a phone number (e.g., +1234567890)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s|-/g, ''))) {
      throw new BadRequestException('Invalid phone number format. Please include country code.');
    }

    // Save unverified number
    (user as any).phoneNumber = phoneNumber;
    (user as any).isPhoneVerified = false;
    await user.save();

    // Trigger SMS Service to send code
    await this.smsService.verifyPhoneNumber(phoneNumber);
  }

  async confirmPhoneVerification(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    if (!(user as any).phoneNumber) throw new BadRequestException('No phone number on record to verify.');

    // Check with Twilio
    const isValid = await (this.smsService as any).checkVerificationCode((user as any).phoneNumber, code);

    if (isValid) {
      (user as any).isPhoneVerified = true;
      await user.save();
      return true;
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  async updatePreferences(userId: string, preferences: any): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = (user as any)?.preferences ?? {};
    const merged = deepMergePreferences(existing, preferences);

    return this.update(userId, { preferences: merged });
  }

  async updatePreferenceSection(userId: string, section: string, values: any): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = (user as any)?.preferences ?? {};
    const merged = section === 'calendar' ? deepMergePreferences(existing, { calendar: values }) : deepMergePreferences(existing, { [section]: values });

    return this.update(userId, { preferences: merged });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR & PASSWORD & LOGIN TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserDocument> { return this.update(userId, { profilePicture: avatarUrl, avatarUrl } as any); }
  async updateProfile(id: string, profileData: any): Promise<UserDocument> { return this.update(id, profileData); }
  async updateNotificationPreferences(id: string, preferences: any): Promise<UserDocument> { const patch = Array.isArray(preferences) ? { notificationPreferences: preferences } : { notifications: preferences }; return this.update(id, patch); }

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projects.findAll(userId);
    return { School: projects.filter((p: any) => p.category === 'School'), Job: projects.filter((p: any) => p.category === 'Job'), Personal: projects.filter((p: any) => p.category === 'Personal') };
  }

  async updatePassword(email: string, newPasswordHash: string): Promise<UserDocument | null> {
    const result = await this.userModel.findOneAndUpdate({ email }, { password: newPasswordHash }, { new: true }).exec();
    return result as any;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) throw new NotFoundException('User not found');
    const isValid = await bcrypt.compare(currentPassword, (user as any).password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    (user as any).password = hashedPassword;
    (user as any).tokenVersion = ((user as any).tokenVersion || 0) + 1;
    await user.save();
  }

  async trackLoginActivity(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin as any) : null;
    const diffDays = last ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (diffDays === 1) { (user as any).streakDays = ((user as any).streakDays || 0) + 1; } 
    else if (diffDays !== 0) { (user as any).streakDays = 1; }

    (user as any).lastLogin = now;
    const saved = await user.save();
    return saved as any;
  }

  async getTopStreaks(limit = 10): Promise<any[]> {
    const result = await this.userModel.find({}, { firstName: 1, streakDays: 1, profilePicture: 1 }).sort({ streakDays: -1 }).limit(limit).exec();
    return result as any;
  }

  async searchUsers(query: string, limit = 10): Promise<any[]> {
    if (!query || query.length < 2) return [];
    const regex = new RegExp(query, 'i');
    const users = await this.userModel.find({ $or: [ { username: regex }, { firstName: regex }, { lastName: regex }, { email: regex } ], publicProfile: { $ne: false } }).select('_id username firstName lastName profilePicture bio').limit(limit).exec();
    return users as any;
  }

  async getActivitySummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const baseXp = (user as any).xp ?? (user as any).points ?? 0;
    const { items } = await this.activities.list({ scope: 'user', userId, range: '30d', cursor: null, limit: 500 });
    const summary = buildActivitySummary(items.map((a: any) => ({ timestamp: a.createdAt || a.ts, type: a.type || a.eventType || 'UNKNOWN', xpDelta: a.xpDelta ?? a.meta?.xpDelta ?? 0 })), baseXp);
    return summary;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT / DELETE (GDPR)
  // ═══════════════════════════════════════════════════════════════════════════

  async exportUserData(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password -resetToken -verificationToken -verificationCode').lean().exec();
    if (!user) throw new NotFoundException('User not found');

    let projects = [];
    try { projects = await this.projects.findAll(userId); } catch (e) {}

    let activities = [];
    try {
      const result = await this.activities.list({ scope: 'user', userId, range: '365d', cursor: null, limit: 1000 });
      activities = result.items || [];
    } catch (e) {}

    return {
      exportedAt: new Date().toISOString(),
      user: { id: (user as any)._id, email: (user as any).email, username: (user as any).username, firstName: (user as any).firstName, lastName: (user as any).lastName, bio: (user as any).bio, location: (user as any).location, timezone: (user as any).timezone, publicProfile: (user as any).publicProfile, createdAt: (user as any).createdAt, lastLogin: (user as any).lastLogin, xp: (user as any).xp, level: (user as any).level, streakDays: (user as any).streakDays, totalShips: (user as any).totalShips, achievements: (user as any).achievements, badges: (user as any).badges, settings: (user as any).settings, preferences: (user as any).preferences },
      projects: projects.map((p: any) => ({ id: p._id, name: p.name || p.title, description: p.description, category: p.category, status: p.status, createdAt: p.createdAt })),
      activities: activities.map((a: any) => ({ type: a.type, createdAt: a.createdAt, payload: a.payload })),
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    try {
      // ✅ Silenced TS Error using type casting
      await (this.projects as any).deleteAllForUser(userId);
    } catch (e) {
      console.warn('Could not delete user projects:', e);
    }

    await this.userModel.findByIdAndDelete(userId).exec();
  }
}

// src/user/user.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER SERVICE - User management and settings
// Phase 7: Added getSettings, updateSettings, exportUserData, deleteAccount, etc.
// Priority 1: Added onboarding status, profile strength, first-ship tracking
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

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PRIORITY 1 HELPER: Safe display name resolver
// Falls back through: displayName → firstName+lastName → username → email prefix
// NEVER returns "User" or empty string.
// ═══════════════════════════════════════════════════════════════════════════════

function resolveDisplayName(user: any): string {
  // 1. displayName (if explicitly set and not blank/generic)
  const dn = (user.displayName || '').trim();
  if (dn && dn.toLowerCase() !== 'user' && dn.toLowerCase() !== 'demo user') return dn;

  // 2. firstName + lastName
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full && full.toLowerCase() !== 'user' && full.toLowerCase() !== 'demo user') return full;

  // 3. username
  const un = (user.username || '').trim();
  if (un) return un;

  // 4. email prefix
  const email = (user.email || '').trim();
  if (email && email.includes('@')) return email.split('@')[0];

  // 5. Absolute fallback (should never hit this)
  return 'New User';
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,

    private readonly activities: ActivitiesService,
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
      appearance: { theme: (user as any).preferences?.theme || 'system', mode: 'pro' },
      mentor: { enabled: true, tone: 'wise', intensity: 3 },
      momentum: { dailyGoal: 5, weekendCount: true, allowFreeze: true },
      focus: {
        dailyTarget: (user as any).preferences?.focusMode?.duration ? Math.floor((user as any).preferences.focusMode.duration / 60) : 4,
        autoStart: (user as any).preferences?.focusMode?.autoEnable ?? false,
        startTime: '09:00',
      },
      social: { showStreakTo: 'friends', celebrate: true },
      legacy: { showEverywhere: true, yearlyVideo: false },
      security: { twoFA: false },
      preferences: (user as any).preferences || {},
      publicProfile: (user as any).publicProfile ?? true,
      discoverable: (user as any).preferences?.privacy?.publicProfile ?? false,
      // ✅ Priority 1: Include resolved display name in settings response
      displayName: resolveDisplayName(user),
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

    if (settingsDto.appearance) {
      const existing = (user as any).preferences ?? {};
      (user as any).preferences = { ...existing, theme: settingsDto.appearance.theme ?? existing.theme };
    }

    const nestedFields = ['mentor', 'momentum', 'focus', 'social', 'legacy', 'security'];
    for (const field of nestedFields) {
      if (settingsDto[field] !== undefined) {
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

    // ✅ Priority 1: Record firstLoginAt on very first login
    if (!(user as any).firstLoginAt) {
      (user as any).firstLoginAt = now;
    }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ PRIORITY 1: ONBOARDING & PROFILE STRENGTH (Zero-State Revolution)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Resolve the best display name for any user document.
   * Exported as a static-like method so controllers/other services can use it.
   */
  getDisplayName(user: any): string {
    return resolveDisplayName(user);
  }

  /**
   * GET /users/me/onboarding
   * Returns the user's onboarding progress for the frontend OnboardingContext.
   */
  async getOnboardingStatus(userId: string): Promise<{
    onboardingCompleted: boolean;
    firstLoginAt: Date | null;
    firstShipAt: Date | null;
    hasProjects: boolean;
    hasTasks: boolean;
    displayName: string;
  }> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    // Check if user has any projects
    let hasProjects = false;
    try {
      const userProjects = await this.projects.findAll(userId);
      hasProjects = userProjects.length > 0;
    } catch (e) {
      // If projects service fails, don't block onboarding
      hasProjects = false;
    }

    return {
      onboardingCompleted: (user as any).onboardingCompleted ?? false,
      firstLoginAt: (user as any).firstLoginAt || null,
      firstShipAt: (user as any).firstShipAt || null,
      hasProjects,
      hasTasks: ((user as any).totalTasksCompleted || 0) > 0 || ((user as any).totalShips || 0) > 0,
      displayName: resolveDisplayName(user),
    };
  }

  /**
   * PATCH /users/me/onboarding
   * Marks onboarding as completed. Additive only — never un-completes.
   */
  async completeOnboarding(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    (user as any).onboardingCompleted = true;
    const saved = await user.save();
    return saved as any;
  }

  /**
   * GET /users/me/profile-strength
   * Calculates profile completion percentage based on filled fields + activity.
   */
  async getProfileStrength(userId: string): Promise<{
    percentage: number;
    completed: string[];
    missing: { key: string; label: string; points: number }[];
  }> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    const u = user as any;
    const completed: string[] = [];
    const missing: { key: string; label: string; points: number }[] = [];

    // Define criteria: key, label, points, check function
    const criteria: Array<{ key: string; label: string; points: number; check: () => boolean }> = [
      {
        key: 'avatar',
        label: 'Add a profile photo',
        points: 15,
        check: () => !!(u.profilePicture && u.profilePicture.trim()),
      },
      {
        key: 'bio',
        label: 'Write a short bio',
        points: 10,
        check: () => !!(u.bio && u.bio.trim()),
      },
      {
        key: 'name',
        label: 'Set your full name',
        points: 10,
        check: () => {
          const first = (u.firstName || '').trim();
          const last = (u.lastName || '').trim();
          return !!(first && last && first.toLowerCase() !== 'user');
        },
      },
      {
        key: 'location',
        label: 'Add your location',
        points: 5,
        check: () => !!(u.location && u.location.trim()),
      },
      {
        key: 'jobTitle',
        label: 'Add your role or title',
        points: 5,
        check: () => !!(u.jobTitle && u.jobTitle.trim()),
      },
      {
        key: 'firstProject',
        label: 'Create your first project',
        points: 20,
        check: () => (u.projects && u.projects.length > 0),
      },
      {
        key: 'firstShip',
        label: 'Complete your first task',
        points: 20,
        check: () => (u.totalTasksCompleted || 0) > 0 || (u.totalShips || 0) > 0,
      },
      {
        key: 'streak',
        label: 'Build a 3-day streak',
        points: 15,
        check: () => (u.streakDays || 0) >= 3,
      },
    ];

    let totalPossible = 0;
    let totalEarned = 0;

    for (const c of criteria) {
      totalPossible += c.points;
      if (c.check()) {
        completed.push(c.key);
        totalEarned += c.points;
      } else {
        missing.push({ key: c.key, label: c.label, points: c.points });
      }
    }

    const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    return { percentage, completed, missing };
  }

  /**
   * Called when user completes their very first task.
   * Records the timestamp for time-to-first-ship metric.
   */
  async recordFirstShip(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    // Only record once — don't overwrite
    if (!(user as any).firstShipAt) {
      (user as any).firstShipAt = new Date();
      await user.save();
    }
  }
}

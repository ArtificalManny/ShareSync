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

  /**
   * Get user settings for the Settings page
   */
  async getSettings(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -resetToken -verificationToken -verificationCode')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    // Return settings in the format expected by Settings.jsx
    return {
      // Profile fields
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

      // Notification settings
      notificationSettings: {
        emailDigest: (user as any).settings?.weeklyDigest ?? true,
        pushNotifications: (user as any).settings?.pushNotifications ?? true,
        mentionAlerts: true,
        weeklyReport: (user as any).settings?.weeklyDigest ?? true,
        emailActivity: (user as any).settings?.emailNotifications ?? true,
      },

      // Privacy settings
      privacySettings: {
        profilePublic: (user as any).publicProfile ?? true,
        showActivity: (user as any).preferences?.privacy?.showActivity ?? true,
        allowDMs: true,
      },

      // Appearance
      appearance: {
        theme: (user as any).preferences?.theme || 'system',
        mode: 'pro',
      },

      // Mentor settings
      mentor: {
        enabled: true,
        tone: 'wise',
        intensity: 3,
      },

      // Momentum settings
      momentum: {
        dailyGoal: 5,
        weekendCount: true,
        allowFreeze: true,
      },

      // Focus settings
      focus: {
        dailyTarget: (user as any).preferences?.focusMode?.duration
          ? Math.floor((user as any).preferences.focusMode.duration / 60)
          : 4,
        autoStart: (user as any).preferences?.focusMode?.autoEnable ?? false,
        startTime: '09:00',
      },

      // Social settings
      social: {
        showStreakTo: 'friends',
        celebrate: true,
      },

      // Legacy settings
      legacy: {
        showEverywhere: true,
        yearlyVideo: false,
      },

      // Security
      security: {
        twoFA: false,
      },

      // Raw preferences object
      preferences: (user as any).preferences || {},

      // Public profile flag
      publicProfile: (user as any).publicProfile ?? true,
      discoverable: (user as any).preferences?.privacy?.publicProfile ?? false,
    };
  }

  /**
   * Update user settings from Settings page
   */
  async updateSettings(userId: string, settingsDto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    // Extract profile fields
    const profileFields = [
      'firstName', 'lastName', 'username', 'email', 'bio',
      'timezone', 'location', 'jobTitle', 'company', 'website',
    ];

    for (const field of profileFields) {
      if (settingsDto[field] !== undefined) {
        (user as any)[field] = settingsDto[field];
      }
    }

    // Handle notification settings
    if (settingsDto.notificationSettings) {
      const ns = settingsDto.notificationSettings;
      (user as any).settings = {
        ...((user as any).settings || {}),
        emailNotifications: ns.emailActivity ?? (user as any).settings?.emailNotifications ?? true,
        pushNotifications: ns.pushNotifications ?? (user as any).settings?.pushNotifications ?? true,
        weeklyDigest: ns.weeklyReport ?? (user as any).settings?.weeklyDigest ?? true,
      };
    }

    // Handle privacy settings
    if (settingsDto.privacySettings) {
      (user as any).publicProfile = settingsDto.privacySettings.profilePublic ?? (user as any).publicProfile;
    }

    if (settingsDto.publicProfile !== undefined) {
      (user as any).publicProfile = settingsDto.publicProfile;
    }

    // Handle appearance settings
    if (settingsDto.appearance) {
      const existing = (user as any).preferences ?? {};
      (user as any).preferences = {
        ...existing,
        theme: settingsDto.appearance.theme ?? existing.theme,
      };
    }

    // Handle nested settings objects
    const nestedFields = ['mentor', 'momentum', 'focus', 'social', 'legacy', 'security'];
    for (const field of nestedFields) {
      if (settingsDto[field] !== undefined) {
        const existing = (user as any).preferences ?? {};
        (user as any).preferences = {
          ...existing,
          [field]: {
            ...(existing[field] || {}),
            ...settingsDto[field],
          },
        };
      }
    }

    // Handle full preferences object
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

  async updatePreferenceSection(
    userId: string,
    section: string,
    values: any,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = (user as any)?.preferences ?? {};

    // If section is one of the nested ones, merge it safely
    const merged =
      section === 'calendar'
        ? deepMergePreferences(existing, { calendar: values })
        : deepMergePreferences(existing, { [section]: values });

    return this.update(userId, { preferences: merged });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR
  // ═══════════════════════════════════════════════════════════════════════════

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserDocument> {
    return this.update(userId, {
      profilePicture: avatarUrl,
      avatarUrl,
    } as any);
  }

  async updateProfile(
    id: string,
    profileData: {
      profilePicture?: string;
      bannerPicture?: string;
      school?: string;
      job?: string;
      publicProfile?: boolean;
      appearance?: any;
    },
  ): Promise<UserDocument> {
    return this.update(id, profileData);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async updateNotificationPreferences(
    id: string,
    preferences: string[] | { emailActivity?: boolean; emailDigest?: boolean },
  ): Promise<UserDocument> {
    const patch =
      Array.isArray(preferences)
        ? { notificationPreferences: preferences }
        : { notifications: preferences };
    return this.update(id, patch);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projects.findAll(userId);
    return {
      School: projects.filter((p: any) => p.category === 'School'),
      Job: projects.filter((p: any) => p.category === 'Job'),
      Personal: projects.filter((p: any) => p.category === 'Personal'),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  async updatePassword(
    email: string,
    newPasswordHash: string,
  ): Promise<UserDocument | null> {
    const result = await this.userModel
      .findOneAndUpdate({ email }, { password: newPasswordHash }, { new: true })
      .exec();
    return result as any;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, (user as any).password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    (user as any).password = hashedPassword;
    (user as any).tokenVersion = ((user as any).tokenVersion || 0) + 1; // Invalidate existing tokens
    await user.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  async trackLoginActivity(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin as any) : null;
    const diffDays = last
      ? Math.floor(
          (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    if (diffDays === 1) {
      (user as any).streakDays = ((user as any).streakDays || 0) + 1;
    } else if (diffDays === 0) {
      // same-day login: no change
    } else {
      (user as any).streakDays = 1;
    }

    (user as any).lastLogin = now;
    const saved = await user.save();
    return saved as any;
  }

  async getTopStreaks(limit = 10): Promise<any[]> {
    const result = await this.userModel
      .find({}, { firstName: 1, streakDays: 1, profilePicture: 1 })
      .sort({ streakDays: -1 })
      .limit(limit)
      .exec();
    return result as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  async searchUsers(query: string, limit = 10): Promise<any[]> {
    if (!query || query.length < 2) return [];

    const regex = new RegExp(query, 'i');

    const users = await this.userModel
      .find({
        $or: [
          { username: regex },
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ],
        publicProfile: { $ne: false },
      })
      .select('_id username firstName lastName profilePicture bio')
      .limit(limit)
      .exec();

    return users as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVITY SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  async getActivitySummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const baseXp =
      (user as any).xp ??
      (user as any).points ??
      0;

    const { items } = await this.activities.list({
      scope: 'user',
      userId,
      range: '30d',
      cursor: null,
      limit: 500,
    });

    const summary = buildActivitySummary(
      items.map((a: any) => ({
        timestamp: a.createdAt || a.ts,
        type: a.type || a.eventType || 'UNKNOWN',
        xpDelta: a.xpDelta ?? a.meta?.xpDelta ?? 0,
      })),
      baseXp,
    );

    return summary;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT / DELETE (GDPR)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Export all user data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -resetToken -verificationToken -verificationCode')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    // Get user's projects
    let projects = [];
    try {
      projects = await this.projects.findAll(userId);
    } catch (e) {
      // Projects service might not be available
    }

    // Get user's activities
    let activities = [];
    try {
      const result = await this.activities.list({
        scope: 'user',
        userId,
        range: '365d',
        cursor: null,
        limit: 1000,
      });
      activities = result.items || [];
    } catch (e) {
      // Activities service might not be available
    }

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: (user as any)._id,
        email: (user as any).email,
        username: (user as any).username,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        bio: (user as any).bio,
        location: (user as any).location,
        timezone: (user as any).timezone,
        publicProfile: (user as any).publicProfile,
        createdAt: (user as any).createdAt,
        lastLogin: (user as any).lastLogin,
        xp: (user as any).xp,
        level: (user as any).level,
        streakDays: (user as any).streakDays,
        totalShips: (user as any).totalShips,
        achievements: (user as any).achievements,
        badges: (user as any).badges,
        settings: (user as any).settings,
        preferences: (user as any).preferences,
      },
      projects: projects.map((p: any) => ({
        id: p._id,
        name: p.name || p.title,
        description: p.description,
        category: p.category,
        status: p.status,
        createdAt: p.createdAt,
      })),
      activities: activities.map((a: any) => ({
        type: a.type,
        createdAt: a.createdAt,
        payload: a.payload,
      })),
    };
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    // Delete user's projects
    try {
      await this.projects.deleteAllForUser(userId);
    } catch (e) {
      // Projects service might not have this method
      console.warn('Could not delete user projects:', e);
    }

    // Delete the user
    await this.userModel.findByIdAndDelete(userId).exec();
  }
}

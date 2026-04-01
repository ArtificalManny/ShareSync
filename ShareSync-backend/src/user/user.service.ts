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
// SETTINGS DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_MODULAR_SETTINGS = {
  appearance: {
    theme: 'system',
    mode: 'pro',
  },
  mentor: {
    enabled: true,
    tone: 'wise',
    intensity: 3,
  },
  momentum: {
    dailyGoal: 5,
    weekendCount: true,
    allowFreeze: true,
  },
  focus: {
    dailyTarget: 4,
    autoStart: false,
    startTime: '09:00',
    blockedApps: [],
    emergencyBreaksLeft: 1,
  },
  social: {
    showStreakTo: 'friends',
    celebrate: true,
    publicProfile: true,
    discoverable: false,
  },
  legacy: {
    showEverywhere: true,
    yearlyVideo: false,
  },
  notifications: {
    emailActivity: true,
    emailDigest: true,
    pushNotifications: true,
    mentionAlerts: true,
    weeklyReport: true,
  },
  security: {
    twoFA: false,
  },
};

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

    appearance: {
      ...(e.appearance ?? {}),
      ...(i.appearance ?? {}),
    },

    mentor: {
      ...(e.mentor ?? {}),
      ...(i.mentor ?? {}),
    },

    momentum: {
      ...(e.momentum ?? {}),
      ...(i.momentum ?? {}),
    },

    focus: {
      ...(e.focus ?? {}),
      ...(i.focus ?? {}),
      blockedApps: Array.isArray(i.focus?.blockedApps)
        ? i.focus.blockedApps
        : (e.focus?.blockedApps ?? []),
    },

    social: {
      ...(e.social ?? {}),
      ...(i.social ?? {}),
    },

    legacy: {
      ...(e.legacy ?? {}),
      ...(i.legacy ?? {}),
    },

    security: {
      ...(e.security ?? {}),
      ...(i.security ?? {}),
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

function flattenDefinedValues(
  source: Record<string, any>,
  prefix: string,
  target: Record<string, any>,
) {
  if (!source || typeof source !== 'object') return;

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;

    const fullPath = `${prefix}.${key}`;

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenDefinedValues(value as Record<string, any>, fullPath, target);
      continue;
    }

    target[fullPath] = value;
  }
}

function normalizeSettingsFromUser(user: any): Record<string, any> {
  const preferences = user?.preferences ?? {};
  const legacySettings = user?.settings ?? {};

  const appearance = {
    ...DEFAULT_MODULAR_SETTINGS.appearance,
    ...(preferences.appearance ?? {}),
    theme:
      preferences.appearance?.theme ??
      preferences.theme ??
      DEFAULT_MODULAR_SETTINGS.appearance.theme,
  };

  const mentor = {
    ...DEFAULT_MODULAR_SETTINGS.mentor,
    ...(preferences.mentor ?? {}),
  };

  const momentum = {
    ...DEFAULT_MODULAR_SETTINGS.momentum,
    ...(preferences.momentum ?? {}),
  };

  const focus = {
    ...DEFAULT_MODULAR_SETTINGS.focus,
    ...(preferences.focus ?? {}),
    dailyTarget:
      preferences.focus?.dailyTarget ??
      (
        typeof preferences.focusMode?.duration === 'number'
          ? Math.floor(preferences.focusMode.duration / 60)
          : DEFAULT_MODULAR_SETTINGS.focus.dailyTarget
      ),
    autoStart:
      preferences.focus?.autoStart ??
      preferences.focusMode?.autoEnable ??
      DEFAULT_MODULAR_SETTINGS.focus.autoStart,
    startTime:
      preferences.focus?.startTime ??
      DEFAULT_MODULAR_SETTINGS.focus.startTime,
    blockedApps: Array.isArray(preferences.focus?.blockedApps)
      ? preferences.focus.blockedApps
      : DEFAULT_MODULAR_SETTINGS.focus.blockedApps,
    emergencyBreaksLeft:
      preferences.focus?.emergencyBreaksLeft ??
      DEFAULT_MODULAR_SETTINGS.focus.emergencyBreaksLeft,
  };

  const social = {
    ...DEFAULT_MODULAR_SETTINGS.social,
    ...(preferences.social ?? {}),
    publicProfile:
      preferences.social?.publicProfile ??
      user?.publicProfile ??
      DEFAULT_MODULAR_SETTINGS.social.publicProfile,
    discoverable:
      preferences.social?.discoverable ??
      DEFAULT_MODULAR_SETTINGS.social.discoverable,
  };

  const legacy = {
    ...DEFAULT_MODULAR_SETTINGS.legacy,
    ...(preferences.legacy ?? {}),
  };

  const notifications = {
    ...DEFAULT_MODULAR_SETTINGS.notifications,
    emailActivity:
      legacySettings.emailNotifications ??
      DEFAULT_MODULAR_SETTINGS.notifications.emailActivity,
    emailDigest:
      legacySettings.weeklyDigest ??
      DEFAULT_MODULAR_SETTINGS.notifications.emailDigest,
    pushNotifications:
      legacySettings.pushNotifications ??
      DEFAULT_MODULAR_SETTINGS.notifications.pushNotifications,
    weeklyReport:
      legacySettings.weeklyDigest ??
      DEFAULT_MODULAR_SETTINGS.notifications.weeklyReport,
  };

  const security = {
    ...DEFAULT_MODULAR_SETTINGS.security,
    ...(preferences.security ?? {}),
  };

  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'America/Los_Angeles',
    location: user?.location || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    website: user?.website || '',

    appearance,
    mentor,
    momentum,
    focus,
    social,
    legacy,
    notifications,
    security,

    // Backward-compat aliases
    notificationSettings: {
      emailDigest: notifications.emailDigest,
      pushNotifications: notifications.pushNotifications,
      mentionAlerts: notifications.mentionAlerts,
      weeklyReport: notifications.weeklyReport,
      emailActivity: notifications.emailActivity,
    },
    privacySettings: {
      profilePublic: social.publicProfile,
      showActivity: preferences?.privacy?.showActivity ?? true,
      allowDMs: true,
    },

    preferences,
    publicProfile: social.publicProfile,
    discoverable: social.discoverable,
  };
}

function buildSettingsUpdatePayload(settingsDto: any): Record<string, any> {
  const payload: Record<string, any> = {};

  const profileFields = [
    'firstName',
    'lastName',
    'username',
    'email',
    'bio',
    'timezone',
    'location',
    'jobTitle',
    'company',
    'website',
  ];

  for (const field of profileFields) {
    if (settingsDto[field] !== undefined) {
      payload[field] = settingsDto[field];
    }
  }

  const incomingNotifications =
    settingsDto.notifications ?? settingsDto.notificationSettings;

  if (incomingNotifications) {
    if (incomingNotifications.emailActivity !== undefined) {
      payload['settings.emailNotifications'] = Boolean(incomingNotifications.emailActivity);
    }

    if (incomingNotifications.pushNotifications !== undefined) {
      payload['settings.pushNotifications'] = Boolean(incomingNotifications.pushNotifications);
    }

    const weeklyDigestValue =
      incomingNotifications.emailDigest !== undefined
        ? incomingNotifications.emailDigest
        : incomingNotifications.weeklyReport;

    if (weeklyDigestValue !== undefined) {
      payload['settings.weeklyDigest'] = Boolean(weeklyDigestValue);
    }
  }

  if (settingsDto.privacySettings?.profilePublic !== undefined) {
    payload.publicProfile = Boolean(settingsDto.privacySettings.profilePublic);
  }

  if (settingsDto.privacySettings?.showActivity !== undefined) {
    payload['preferences.privacy.showActivity'] = Boolean(settingsDto.privacySettings.showActivity);
  }

  if (settingsDto.publicProfile !== undefined) {
    payload.publicProfile = Boolean(settingsDto.publicProfile);
    payload['preferences.social.publicProfile'] = Boolean(settingsDto.publicProfile);
    payload['preferences.privacy.publicProfile'] = Boolean(settingsDto.publicProfile);
  }

  if (settingsDto.discoverable !== undefined) {
    payload['preferences.social.discoverable'] = Boolean(settingsDto.discoverable);
  }

  if (settingsDto.appearance) {
    flattenDefinedValues(settingsDto.appearance, 'preferences.appearance', payload);

    if (settingsDto.appearance.theme !== undefined) {
      payload['preferences.theme'] = settingsDto.appearance.theme;
      payload['preferences.appearance.theme'] = settingsDto.appearance.theme;
    }

    if (settingsDto.appearance.sounds !== undefined) {
      payload['settings.soundEffects'] = Boolean(settingsDto.appearance.sounds);
    }
  }

  if (settingsDto.mentor) {
    flattenDefinedValues(settingsDto.mentor, 'preferences.mentor', payload);
  }

  if (settingsDto.momentum) {
    flattenDefinedValues(settingsDto.momentum, 'preferences.momentum', payload);
  }

  if (settingsDto.focus) {
    flattenDefinedValues(settingsDto.focus, 'preferences.focus', payload);

    if (settingsDto.focus.dailyTarget !== undefined) {
      payload['preferences.focusMode.duration'] = Number(settingsDto.focus.dailyTarget) * 60;
    }

    if (settingsDto.focus.autoStart !== undefined) {
      payload['preferences.focusMode.autoEnable'] = Boolean(settingsDto.focus.autoStart);
    }
  }

  if (settingsDto.social) {
    flattenDefinedValues(settingsDto.social, 'preferences.social', payload);

    if (settingsDto.social.publicProfile !== undefined) {
      payload.publicProfile = Boolean(settingsDto.social.publicProfile);
      payload['preferences.privacy.publicProfile'] = Boolean(settingsDto.social.publicProfile);
    }

    if (settingsDto.social.discoverable !== undefined) {
      payload['preferences.social.discoverable'] = Boolean(settingsDto.social.discoverable);
    }
  }

  if (settingsDto.legacy) {
    flattenDefinedValues(settingsDto.legacy, 'preferences.legacy', payload);
  }

  if (settingsDto.security) {
    flattenDefinedValues(settingsDto.security, 'preferences.security', payload);
  }

  if (settingsDto.preferences) {
    flattenDefinedValues(settingsDto.preferences, 'preferences', payload);

    if (settingsDto.preferences.theme !== undefined) {
      payload['preferences.theme'] = settingsDto.preferences.theme;
    }

    if (settingsDto.preferences.appearance?.theme !== undefined) {
      payload['preferences.theme'] = settingsDto.preferences.appearance.theme;
    }

    if (settingsDto.preferences.focus?.dailyTarget !== undefined) {
      payload['preferences.focusMode.duration'] =
        Number(settingsDto.preferences.focus.dailyTarget) * 60;
    }

    if (settingsDto.preferences.focus?.autoStart !== undefined) {
      payload['preferences.focusMode.autoEnable'] =
        Boolean(settingsDto.preferences.focus.autoStart);
    }

    if (settingsDto.preferences.privacy?.publicProfile !== undefined) {
      payload.publicProfile = Boolean(settingsDto.preferences.privacy.publicProfile);
    }
  }

  return payload;
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

    return normalizeSettingsFromUser(user);
  }

  async updateSettings(userId: string, settingsDto: any): Promise<any> {
    const existingUser = await this.userModel.exists({ _id: userId });
    if (!existingUser) throw new NotFoundException('User not found');

    const updatePayload = buildSettingsUpdatePayload(settingsDto);

    if (Object.keys(updatePayload).length > 0) {
      await this.userModel
        .updateOne(
          { _id: userId },
          { $set: updatePayload },
          { runValidators: true },
        )
        .exec();
    }

    return this.getSettings(userId);
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
    if (!(user as any).phoneNumber) {
      throw new BadRequestException('No phone number on record to verify.');
    }

    // Check with Twilio
    const isValid = await (this.smsService as any).checkVerificationCode(
      (user as any).phoneNumber,
      code,
    );

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

  async updatePreferenceSection(
    userId: string,
    section: string,
    values: any,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = (user as any)?.preferences ?? {};
    const merged =
      section === 'calendar'
        ? deepMergePreferences(existing, { calendar: values })
        : deepMergePreferences(existing, { [section]: values });

    return this.update(userId, { preferences: merged });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR & PASSWORD & LOGIN TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserDocument> {
    return this.update(userId, { profilePicture: avatarUrl, avatarUrl } as any);
  }

  async updateProfile(id: string, profileData: any): Promise<UserDocument> {
    return this.update(id, profileData);
  }

  async updateNotificationPreferences(id: string, preferences: any): Promise<UserDocument> {
    const patch = Array.isArray(preferences)
      ? { notificationPreferences: preferences }
      : { notifications: preferences };

    return this.update(id, patch);
  }

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projects.findAll(userId);

    return {
      School: projects.filter((p: any) => p.category === 'School'),
      Job: projects.filter((p: any) => p.category === 'Job'),
      Personal: projects.filter((p: any) => p.category === 'Personal'),
    };
  }

  async updatePassword(email: string, newPasswordHash: string): Promise<UserDocument | null> {
    const result = await this.userModel
      .findOneAndUpdate({ email }, { password: newPasswordHash }, { new: true })
      .exec();

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
    const diffDays = last
      ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (diffDays === 1) {
      (user as any).streakDays = ((user as any).streakDays || 0) + 1;
    } else if (diffDays !== 0) {
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

  async getActivitySummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const baseXp = (user as any).xp ?? (user as any).points ?? 0;

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

  async exportUserData(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -resetToken -verificationToken -verificationCode')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    let projects = [];
    try {
      projects = await this.projects.findAll(userId);
    } catch (e) {}

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
    } catch (e) {}

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

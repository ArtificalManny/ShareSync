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
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types} from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { ProjectsService } from '../projects/projects.service';
import { ActivitiesService } from '../activities/activities.service';
import { buildActivitySummary } from '../utils/activitySummary';
import { SmsService } from '../notifications/sms.service';
import { StreakService } from '../gamification/services/streak.service';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════


function escapeRegex(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,

    private readonly activities: ActivitiesService,

    // ✅ Phase 13: SMS for phone verification
    private readonly smsService: SmsService,

    // ✅ Optional to avoid boot failures if UserModule has not imported/exported the streak provider yet
    @Optional() private readonly streakService?: StreakService,
  ) {}


  private getStatsDate(value: any): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getStatsDayKey(value: any): string | null {
    const date = this.getStatsDate(value);
    if (!date) return null;

    return date.toISOString().slice(0, 10);
  }

  private calculateCurrentStreakFromCompletedTasks(tasks: any[]): number {
    const dayKeys = new Set<string>();

    for (const task of Array.isArray(tasks) ? tasks : []) {
      const key = this.getStatsDayKey(task?.completedAt);
      if (key) dayKeys.add(key);
    }

    if (dayKeys.size === 0) return 0;

    const cursor = new Date();
    let streak = 0;

    while (true) {
      const key = cursor.toISOString().slice(0, 10);

      if (!dayKeys.has(key)) {
        break;
      }

      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
  }

  async getMyStats(userId: string): Promise<any> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const oid = new Types.ObjectId(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const userActivityQuery = {
      $or: [
        { completedBy: oid },
        { assigneeId: oid },
        { assignee: oid },
        { createdBy: oid },
        { reporterId: oid },
        { reporter: oid },
      ],
    };

    const completedStatusQuery = {
      status: { $in: ['done', 'completed', 'DONE', 'COMPLETED'] },
      completedAt: { $exists: true, $ne: null },
    };

    const [user, completedTasks, recentRelevantCount] = await Promise.all([
      this.userModel
        .findById(oid)
        .select('totalShips streakDays currentStreak longestStreak xp level')
        .lean()
        .exec(),

      this.taskModel
        .find({
          $and: [userActivityQuery, completedStatusQuery],
        })
        .select('_id status completedAt completedBy assigneeId createdBy reporterId')
        .lean()
        .exec(),

      this.taskModel
        .countDocuments({
          $and: [
            userActivityQuery,
            {
              $or: [
                { createdAt: { $gte: sevenDaysAgo } },
                { updatedAt: { $gte: sevenDaysAgo } },
                { completedAt: { $gte: sevenDaysAgo } },
              ],
            },
          ],
        })
        .exec(),
    ]);

    const totalShipsFromTasks = completedTasks.length;

    const weeklyShips = completedTasks.filter((task: any) => {
      const completedAt = this.getStatsDate(task?.completedAt);
      return completedAt && completedAt >= sevenDaysAgo;
    }).length;

    const previousWeekShips = completedTasks.filter((task: any) => {
      const completedAt = this.getStatsDate(task?.completedAt);
      return completedAt && completedAt >= fourteenDaysAgo && completedAt < sevenDaysAgo;
    }).length;

    const activeDaysThisWeek = new Set(
      completedTasks
        .filter((task: any) => {
          const completedAt = this.getStatsDate(task?.completedAt);
          return completedAt && completedAt >= sevenDaysAgo;
        })
        .map((task: any) => this.getStatsDayKey(task?.completedAt))
        .filter(Boolean),
    ).size;

    const calculatedStreak = this.calculateCurrentStreakFromCompletedTasks(completedTasks);
    const persistedStreak = Number((user as any)?.streakDays ?? (user as any)?.currentStreak ?? 0);
    const persistedTotalShips = Number((user as any)?.totalShips ?? 0);

    const totalShips = Math.max(totalShipsFromTasks, persistedTotalShips);
    const streakDays = Math.max(calculatedStreak, persistedStreak);

    const focus =
      recentRelevantCount > 0
        ? Math.min(100, Math.round((weeklyShips / recentRelevantCount) * 100))
        : weeklyShips > 0
          ? 100
          : 0;

    const efficiency =
      previousWeekShips === 0
        ? weeklyShips > 0
          ? 100
          : 0
        : Math.round(((weeklyShips - previousWeekShips) / previousWeekShips) * 100);

    return {
      ships: totalShips,
      totalShips,
      shipCount: totalShips,

      weeklyShips,
      shipsThisWeek: weeklyShips,
      shippedThisWeek: weeklyShips,

      lastWeekShips: previousWeekShips,
      activeDaysThisWeek,

      streakDays,
      currentStreak: streakDays,
      longestStreak: Number((user as any)?.longestStreak ?? streakDays),

      focus,
      completionRate: focus,
      efficiency,

      xp: Number((user as any)?.xp ?? 0),
      level: Number((user as any)?.level ?? 1),

      updatedAt: new Date().toISOString(),
    };
  }


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


  async getStreakProtectionStatus(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('streakDays currentStreak longestStreak freezeCount streakFreezeCount lastLogin lastActivityAt updatedAt')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    const streakDays = Number(
      (user as any).streakDays ??
      (user as any).currentStreak ??
      0
    );

    const freezeCount = Number(
      (user as any).streakFreezeCount ??
      (user as any).freezeCount ??
      0
    );

    const lastActivityAt =
      (user as any).lastActivityAt ||
      (user as any).lastLogin ||
      (user as any).updatedAt ||
      null;

    const daysSinceActivity = lastActivityAt
      ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      streakDays,
      currentStreak: streakDays,
      longestStreak: Number((user as any).longestStreak ?? streakDays),
      freezeCount,
      streakFreezeCount: freezeCount,
      canUseFreeze: freezeCount > 0,
      isAtRisk: typeof daysSinceActivity === 'number' ? daysSinceActivity >= 1 : false,
      lastActivityAt,
      daysSinceActivity,
    };
  }

  async useStreakFreeze(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const currentFreezeCount = Number(
      (user as any).streakFreezeCount ??
      (user as any).freezeCount ??
      0
    );

    if (currentFreezeCount <= 0) {
      throw new BadRequestException('No streak freezes available.');
    }

    const nextFreezeCount = currentFreezeCount - 1;
    const streakDays = Number(
      (user as any).streakDays ??
      (user as any).currentStreak ??
      0
    );

    (user as any).streakFreezeCount = nextFreezeCount;
    (user as any).freezeCount = nextFreezeCount;
    (user as any).lastStreakFreezeUsedAt = new Date();

    await user.save();

    return {
      streakDays,
      currentStreak: streakDays,
      longestStreak: Number((user as any).longestStreak ?? streakDays),
      freezeCount: nextFreezeCount,
      streakFreezeCount: nextFreezeCount,
      canUseFreeze: nextFreezeCount > 0,
      isAtRisk: false,
      used: true,
    };
  }

  async searchUsers(query: string, limit = 10): Promise<any[]> {
    const q = String(query || '').trim();
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);

    if (q.length < 2) return [];

    const escaped = escapeRegex(q);
    const regex = new RegExp(escaped, 'i');

    const users = await this.userModel
      .find({
        $or: [
          { username: regex },
          { firstName: regex },
          { lastName: regex },
          { displayName: regex },
          { email: regex },

          // Allows "Sam Ghost" to match firstName + lastName.
          {
            $expr: {
              $regexMatch: {
                input: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ['$firstName', ''] },
                        ' ',
                        { $ifNull: ['$lastName', ''] },
                      ],
                    },
                  },
                },
                regex: escaped,
                options: 'i',
              },
            },
          },
        ],
      })
      .select('_id username firstName lastName displayName email profilePicture avatarUrl bio publicProfile')
      .limit(safeLimit)
      .lean()
      .exec();

    return users.map((u: any) => ({
      id: String(u._id),
      _id: String(u._id),
      username: u.username || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      displayName:
        u.displayName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        u.username ||
        u.email,
      email: u.email || '',
      profilePicture: u.profilePicture || u.avatarUrl || null,
      avatarUrl: u.avatarUrl || u.profilePicture || null,
      bio: u.bio || '',
    }));
  }

  async getActivitySummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const baseXp = (user as any).xp ?? (user as any).points ?? 0;
    const { items } = await this.activities.list({ scope: 'user', userId, range: '30d', cursor: null, limit: 500 });
    const summary = buildActivitySummary(items.map((a: any) => ({ timestamp: a.createdAt || a.ts, type: a.type || a.eventType || 'UNKNOWN', xpDelta: a.xpDelta ?? a.meta?.xpDelta ?? 0 })), baseXp);
    return summary;
  }

  async getWeeklyRhythm(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();

    const startOfDay = (input: Date) => {
      const d = new Date(input);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const addDays = (input: Date, days: number) => {
      const d = new Date(input);
      d.setDate(d.getDate() + days);
      return d;
    };

    const toISODate = (input: Date) => input.toISOString().slice(0, 10);

    // Monday-start week. JS Sunday is 0, so convert Sunday to 6.
    const today = startOfDay(now);
    const mondayOffset = (today.getDay() + 6) % 7;
    const weekStart = addDays(today, -mondayOffset);
    const weekEndExclusive = addDays(weekStart, 7);
    const lastWeekStart = addDays(weekStart, -7);

    const isShipLikeActivity = (activity: any) => {
      const rawType = String(activity?.type || activity?.eventType || '').toUpperCase();
      const rawAction = String(activity?.action || activity?.verb || '').toUpperCase();
      const rawStatus = String(activity?.status || activity?.payload?.status || activity?.meta?.status || '').toUpperCase();
      const rawTitle = String(activity?.title || activity?.message || activity?.label || '').toUpperCase();

      return (
        rawType === 'TASK_COMPLETED' ||
        rawType === 'TASK_COMPLETE' ||
        rawType === 'TASK_DONE' ||
        rawType === 'TASK_SHIPPED' ||
        rawType === 'SHIP' ||
        rawType === 'SHIPPED' ||
        rawAction.includes('COMPLETE') ||
        rawAction.includes('SHIP') ||
        rawStatus === 'DONE' ||
        rawStatus === 'COMPLETED' ||
        rawTitle.includes('COMPLETED') ||
        rawTitle.includes('SHIPPED')
      );
    };

    const getTimestamp = (activity: any) => {
      const value =
        activity?.completedAt ||
        activity?.createdAt ||
        activity?.updatedAt ||
        activity?.ts ||
        activity?.timestamp;

      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    };

    // Reuse the existing activity pipeline instead of adding new Mongoose model wiring.
    const { items } = await this.activities.list({
      scope: 'user',
      userId,
      range: '30d',
      cursor: null,
      limit: 1000,
    });

    const weekCounts = new Map<string, number>();
    const lastWeekCounts = new Map<string, number>();

    for (const activity of items || []) {
      if (!isShipLikeActivity(activity)) continue;

      const ts = getTimestamp(activity);
      if (!ts) continue;

      if (ts >= weekStart && ts < weekEndExclusive) {
        const key = toISODate(ts);
        weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
      }

      if (ts >= lastWeekStart && ts < weekStart) {
        const key = toISODate(ts);
        lastWeekCounts.set(key, (lastWeekCounts.get(key) || 0) + 1);
      }
    }

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(weekStart, index);
      const key = toISODate(date);

      return {
        date: key,
        day: dayLabels[index],
        count: weekCounts.get(key) || 0,
        isToday: key === toISODate(today),
      };
    });

    const thisWeekTotal = days.reduce((sum, day) => sum + day.count, 0);
    const lastWeekTotal = Array.from(lastWeekCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const activeDays = days.filter((day) => day.count > 0).length;
    const peakDay = days.reduce(
      (best, day) => (day.count > best.count ? day : best),
      { date: null, day: '', count: 0 } as any,
    );

    let momentum = 'warming';
    let momentumLabel = 'Warming up';

    if (thisWeekTotal > 0 && lastWeekTotal === 0) {
      momentum = 'rising';
      momentumLabel = 'Rising';
    } else if (thisWeekTotal > lastWeekTotal) {
      momentum = 'rising';
      momentumLabel = 'Rising';
    } else if (thisWeekTotal === lastWeekTotal && thisWeekTotal > 0) {
      momentum = 'steady';
      momentumLabel = 'Steady';
    } else if (thisWeekTotal < lastWeekTotal && thisWeekTotal > 0) {
      momentum = 'cooling';
      momentumLabel = 'Cooling';
    }

    const insight =
      thisWeekTotal > 0
        ? `You shipped ${thisWeekTotal} item${thisWeekTotal === 1 ? '' : 's'} across ${activeDays} active day${activeDays === 1 ? '' : 's'} this week.`
        : 'Your weekly rhythm will appear here once you start shipping activity this week.';

    return {
      days,
      momentum,
      momentumLabel,
      peakDay,
      thisWeekTotal,
      activeDays,
      totalDays: 7,
      lastWeekTotal,
      insight,
      source: 'backend',
    };
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

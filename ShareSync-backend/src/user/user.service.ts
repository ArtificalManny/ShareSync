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
import { EmailService } from '../notifications/email.service';
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

    private readonly emailService: EmailService,

    // ✅ Optional to avoid boot failures if UserModule has not imported/exported the streak provider yet
    @Optional() private readonly streakService?: StreakService,
  ) {}


  private getStatsDate(value: any): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getStatsTimeZone(user: any): string {
    const candidate =
      typeof user?.timezone === 'string' && user.timezone.trim()
        ? user.timezone.trim()
        : 'America/Los_Angeles';

    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: candidate,
      }).format(new Date());

      return candidate;
    } catch {
      return 'America/Los_Angeles';
    }
  }

  private getStatsDayKey(
    value: any,
    timeZone = 'America/Los_Angeles',
  ): string | null {
    const date = this.getStatsDate(value);
    if (!date) return null;

    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);

      const year = parts.find(
        (part) => part.type === 'year',
      )?.value;

      const month = parts.find(
        (part) => part.type === 'month',
      )?.value;

      const day = parts.find(
        (part) => part.type === 'day',
      )?.value;

      if (!year || !month || !day) return null;

      return `${year}-${month}-${day}`;
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  private shiftStatsDayKey(
    dayKey: string,
    numberOfDays: number,
  ): string {
    const [year, month, day] = dayKey
      .split('-')
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day, 12, 0, 0),
    );

    date.setUTCDate(
      date.getUTCDate() + numberOfDays,
    );

    return date.toISOString().slice(0, 10);
  }

  private getStatsWeekStartKey(
    dayKey: string,
  ): string {
    const [year, month, day] = dayKey
      .split('-')
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day, 12, 0, 0),
    );

    const weekday = date.getUTCDay();

    const daysSinceMonday =
      weekday === 0 ? 6 : weekday - 1;

    return this.shiftStatsDayKey(
      dayKey,
      -daysSinceMonday,
    );
  }

  private readStatsActivityText(
    activity: any,
  ): string {
    return [
      activity?.type,
      activity?.eventType,
      activity?.action,
      activity?.verb,
      activity?.entityType,
      activity?.message,

      activity?.payload?.type,
      activity?.payload?.action,
      activity?.payload?.status,
      activity?.payload?.source,

      activity?.details?.type,
      activity?.details?.action,
      activity?.details?.status,
      activity?.details?.source,

      activity?.metadata?.type,
      activity?.metadata?.action,
      activity?.metadata?.status,
      activity?.metadata?.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private getStatsActivityTimestamp(
    activity: any,
  ): Date | null {
    return this.getStatsDate(
      activity?.createdAt ||
        activity?.completedAt ||
        activity?.updatedAt ||
        activity?.timestamp ||
        activity?.ts,
    );
  }

  private isMeaningfulStatsActivity(
    activity: any,
  ): boolean {
    const textValue =
      this.readStatsActivityText(activity);

    if (!textValue) return false;

    const passiveTokens = [
      'viewed',
      'view_count',
      'read',
      'presence',
      'cursor',
      'heartbeat',
      'typing',
      'login',
      'logout',
      'notification',
      'download_count',
    ];

    if (
      passiveTokens.some((token) =>
        textValue.includes(token),
      )
    ) {
      return false;
    }

    // Deleting something does not maintain an execution streak.
    const excludedActions = [
      'deleted',
      'removed',
      'archived',
    ];

    if (
      excludedActions.some((token) =>
        textValue.includes(token),
      )
    ) {
      return false;
    }

    const qualifyingDomains = [
      'task',
      'milestone',
      'checkpoint',
      'roadmap',
      'file',
      'folder',
      'announcement',
      'event',
      'schedule',
      'calendar',
    ];

    const qualifyingActions = [
      'created',
      'added',
      'uploaded',
      'updated',
      'edited',
      'moved',
      'changed',
      'started',
      'completed',
      'done',
      'shipped',
      'assigned',
      'published',
      'reordered',
    ];

    const hasDomain =
      qualifyingDomains.some((token) =>
        textValue.includes(token),
      );

    const hasAction =
      qualifyingActions.some((token) =>
        textValue.includes(token),
      );

    return hasDomain && hasAction;
  }

  private getStatsActivitySemanticKey(
    activity: any,
    timestamp: Date,
  ): string {
    return [
      String(
        activity?.projectId ||
          activity?.payload?.projectId ||
          activity?.details?.projectId ||
          '',
      ),
      String(activity?.entityType || ''),
      String(
        activity?.entityId ||
          activity?.entityKey ||
          '',
      ),
      String(
        activity?.type ||
          activity?.eventType ||
          '',
      ),
      String(
        activity?.action ||
          activity?.verb ||
          '',
      ),
      Math.floor(timestamp.getTime() / 2000),
    ].join('|');
  }

  private calculateProjectActivityStreak(
    activities: any[],
    timeZone: string,
    now = new Date(),
  ): {
    currentStreak: number;
    longestStreak: number;
    activeToday: boolean;
    atRiskToday: boolean;
    activeDaysThisWeek: number;
    lastActiveDate: string | null;
  } {
    const activeDayKeys = new Set<string>();
    const seenActivities = new Set<string>();

    for (
      const activity of Array.isArray(activities)
        ? activities
        : []
    ) {
      if (
        !this.isMeaningfulStatsActivity(activity)
      ) {
        continue;
      }

      const timestamp =
        this.getStatsActivityTimestamp(activity);

      if (!timestamp) continue;

      const semanticKey =
        this.getStatsActivitySemanticKey(
          activity,
          timestamp,
        );

      if (seenActivities.has(semanticKey)) {
        continue;
      }

      seenActivities.add(semanticKey);

      const dayKey = this.getStatsDayKey(
        timestamp,
        timeZone,
      );

      if (dayKey) {
        activeDayKeys.add(dayKey);
      }
    }

    const todayKey =
      this.getStatsDayKey(now, timeZone) ||
      now.toISOString().slice(0, 10);

    const yesterdayKey =
      this.shiftStatsDayKey(todayKey, -1);

    const activeToday =
      activeDayKeys.has(todayKey);

    let cursor: string | null = activeToday
      ? todayKey
      : activeDayKeys.has(yesterdayKey)
        ? yesterdayKey
        : null;

    let currentStreak = 0;

    while (
      cursor &&
      activeDayKeys.has(cursor)
    ) {
      currentStreak += 1;

      cursor = this.shiftStatsDayKey(
        cursor,
        -1,
      );
    }

    const sortedDayKeys = Array.from(
      activeDayKeys,
    ).sort();

    let longestStreak = 0;
    let currentRun = 0;
    let previousKey: string | null = null;

    for (const dayKey of sortedDayKeys) {
      const consecutive =
        previousKey !== null &&
        dayKey ===
          this.shiftStatsDayKey(
            previousKey,
            1,
          );

      currentRun = consecutive
        ? currentRun + 1
        : 1;

      longestStreak = Math.max(
        longestStreak,
        currentRun,
      );

      previousKey = dayKey;
    }

    const weekStartKey =
      this.getStatsWeekStartKey(todayKey);

    const weekEndKey =
      this.shiftStatsDayKey(
        weekStartKey,
        6,
      );

    const activeDaysThisWeek =
      sortedDayKeys.filter(
        (dayKey) =>
          dayKey >= weekStartKey &&
          dayKey <= weekEndKey,
      ).length;

    return {
      currentStreak,
      longestStreak,
      activeToday,
      atRiskToday:
        !activeToday && currentStreak > 0,
      activeDaysThisWeek,
      lastActiveDate:
        sortedDayKeys.length > 0
          ? sortedDayKeys[
              sortedDayKeys.length - 1
            ]
          : null,
    };
  }

  async getMyStats(userId: string): Promise<any> {
    if (
      !userId ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const oid = new Types.ObjectId(userId);
    const now = new Date();

    const sevenDaysAgo = new Date(
      now.getTime() -
        7 * 24 * 60 * 60 * 1000,
    );

    const fourteenDaysAgo = new Date(
      now.getTime() -
        14 * 24 * 60 * 60 * 1000,
    );

    const streakActivitySince = new Date(
      now.getTime() -
        730 * 24 * 60 * 60 * 1000,
    );

    const streakActivityUntil = new Date(
      now.getTime() +
        2 * 24 * 60 * 60 * 1000,
    );

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
      status: {
        $in: [
          'done',
          'completed',
          'DONE',
          'COMPLETED',
        ],
      },
      completedAt: {
        $exists: true,
        $ne: null,
      },
    };

    const [
      user,
      completedTasks,
      recentRelevantCount,
      projectActivities,
    ] = await Promise.all([
      this.userModel
        .findById(oid)
        .select(
          'totalShips streakDays currentStreak longestStreak xp level timezone',
        )
        .lean()
        .exec(),

      this.taskModel
        .find({
          $and: [
            userActivityQuery,
            completedStatusQuery,
          ],
        })
        .select(
          '_id status completedAt completedBy assigneeId createdBy reporterId',
        )
        .lean()
        .exec(),

      this.taskModel
        .countDocuments({
          $and: [
            userActivityQuery,
            {
              $or: [
                {
                  createdAt: {
                    $gte: sevenDaysAgo,
                  },
                },
                {
                  updatedAt: {
                    $gte: sevenDaysAgo,
                  },
                },
                {
                  completedAt: {
                    $gte: sevenDaysAgo,
                  },
                },
              ],
            },
          ],
        })
        .exec(),

      this.activities
        .listUserActivityForRange({
          userId,
          since: streakActivitySince,
          until: streakActivityUntil,
          limit: 5000,
        })
        .catch(() => []),
    ]);

    const timeZone =
      this.getStatsTimeZone(user);

    const activityStreak =
      this.calculateProjectActivityStreak(
        projectActivities,
        timeZone,
        now,
      );

    const totalShipsFromTasks =
      completedTasks.length;

    const weeklyShips = completedTasks.filter(
      (task: any) => {
        const completedAt =
          this.getStatsDate(task?.completedAt);

        return (
          completedAt &&
          completedAt >= sevenDaysAgo
        );
      },
    ).length;

    const previousWeekShips =
      completedTasks.filter((task: any) => {
        const completedAt =
          this.getStatsDate(task?.completedAt);

        return (
          completedAt &&
          completedAt >= fourteenDaysAgo &&
          completedAt < sevenDaysAgo
        );
      }).length;

    const activeDaysThisWeek =
      activityStreak.activeDaysThisWeek;

    const persistedTotalShips = Number(
      (user as any)?.totalShips ?? 0,
    );

    const totalShips = Math.max(
      totalShipsFromTasks,
      persistedTotalShips,
    );

    const streakDays =
      activityStreak.currentStreak;

    const longestStreak =
      activityStreak.longestStreak;

    const focus =
      recentRelevantCount > 0
        ? Math.min(
            100,
            Math.round(
              (weeklyShips /
                recentRelevantCount) *
                100,
            ),
          )
        : weeklyShips > 0
          ? 100
          : 0;

    const efficiency =
      previousWeekShips === 0
        ? weeklyShips > 0
          ? 100
          : 0
        : Math.round(
            ((weeklyShips -
              previousWeekShips) /
              previousWeekShips) *
              100,
          );

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
      longestStreak,

      activeToday:
        activityStreak.activeToday,
      atRiskToday:
        activityStreak.atRiskToday,
      lastActiveDate:
        activityStreak.lastActiveDate,

      timezone: timeZone,
      streakSource: 'project-activity',

      focus,
      completionRate: focus,
      efficiency,

      xp: Number((user as any)?.xp ?? 0),
      level: Number(
        (user as any)?.level ?? 1,
      ),

      updatedAt: new Date().toISOString(),
    };
  }


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
      const date = new Date(input);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const addDays = (input: Date, days: number) => {
      const date = new Date(input);
      date.setDate(date.getDate() + days);
      return date;
    };

    const toISODate = (input: Date) => input.toISOString().slice(0, 10);
    const today = startOfDay(now);
    const mondayOffset = (today.getDay() + 6) % 7;
    const weekStart = addDays(today, -mondayOffset);
    const weekEndExclusive = addDays(weekStart, 7);
    const lastWeekStart = addDays(weekStart, -7);

    const activities = await this.activities.listUserActivityForRange({
      userId,
      since: lastWeekStart,
      until: weekEndExclusive,
      limit: 5000,
    });

    const readText = (activity: any) =>
      [
        activity?.type,
        activity?.eventType,
        activity?.action,
        activity?.verb,
        activity?.entityType,
        activity?.message,
        activity?.payload?.type,
        activity?.payload?.action,
        activity?.payload?.status,
        activity?.details?.type,
        activity?.details?.action,
        activity?.details?.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const getTimestamp = (activity: any): Date | null => {
      const value =
        activity?.createdAt ||
        activity?.completedAt ||
        activity?.updatedAt ||
        activity?.ts ||
        activity?.timestamp;
      const date = value ? new Date(value) : null;
      return date && !Number.isNaN(date.getTime()) ? date : null;
    };

    const passiveTokens = [
      'viewed',
      'view_count',
      'read',
      'presence',
      'cursor',
      'heartbeat',
      'typing',
      'login',
      'logout',
      'notification',
      'download_count',
    ];

    const mutationTokens = [
      'created',
      'added',
      'uploaded',
      'updated',
      'edited',
      'moved',
      'completed',
      'done',
      'shipped',
      'deleted',
      'removed',
      'archived',
      'restored',
      'linked',
      'unlinked',
      'assigned',
      'comment',
      'version',
      'milestone',
      'announcement',
      'file_uploaded',
      'task_',
      'project_',
    ];

    const isMeaningfulProjectActivity = (activity: any) => {
      const textValue = readText(activity);
      if (!textValue) return false;
      if (passiveTokens.some((token) => textValue.includes(token))) return false;

      const hasProjectContext = Boolean(
        activity?.projectId ||
          activity?.payload?.projectId ||
          activity?.details?.projectId,
      );
      const knownDomain = [
        'task',
        'milestone',
        'roadmap',
        'file',
        'announcement',
        'comment',
        'project',
        'folder',
        'event',
        'schedule',
        'thread',
      ].some((token) => textValue.includes(token));

      return (
        (hasProjectContext || knownDomain) &&
        mutationTokens.some((token) => textValue.includes(token))
      );
    };

    const getDomain = (activity: any) => {
      const textValue = readText(activity);
      if (textValue.includes('milestone') || textValue.includes('roadmap')) return 'roadmap';
      if (textValue.includes('announcement')) return 'announcements';
      if (textValue.includes('file') || textValue.includes('folder')) return 'files';
      if (textValue.includes('task')) return 'tasks';
      if (textValue.includes('comment')) return 'comments';
      if (textValue.includes('thread') || textValue.includes('message')) return 'teamRoom';
      if (textValue.includes('event') || textValue.includes('schedule')) return 'schedule';
      return 'projects';
    };

    const weekCounts = new Map<string, number>();
    const lastWeekCounts = new Map<string, number>();
    const breakdown: Record<string, number> = {};
    const seen = new Set<string>();

    for (const activity of activities || []) {
      if (!isMeaningfulProjectActivity(activity)) continue;

      const timestamp = getTimestamp(activity);
      if (!timestamp) continue;

      const semanticKey = [
        String(activity?.projectId || activity?.payload?.projectId || ''),
        String(activity?.entityType || ''),
        String(activity?.entityId || activity?.entityKey || ''),
        String(activity?.type || activity?.eventType || ''),
        String(activity?.action || activity?.verb || ''),
        Math.floor(timestamp.getTime() / 2000),
      ].join('|');

      if (seen.has(semanticKey)) continue;
      seen.add(semanticKey);

      if (timestamp >= weekStart && timestamp < weekEndExclusive) {
        const key = toISODate(timestamp);
        weekCounts.set(key, (weekCounts.get(key) || 0) + 1);

        const domain = getDomain(activity);
        breakdown[domain] = (breakdown[domain] || 0) + 1;
      } else if (timestamp >= lastWeekStart && timestamp < weekStart) {
        const key = toISODate(timestamp);
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

    if (thisWeekTotal > lastWeekTotal) {
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
        ? `You made ${thisWeekTotal} project update${thisWeekTotal === 1 ? '' : 's'} across ${activeDays} active day${activeDays === 1 ? '' : 's'} this week.`
        : 'Your weekly rhythm will appear here once you make project updates this week.';

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
      breakdown,
      source: 'project-activity',
      updatedAt: new Date().toISOString(),
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

  async deleteAccount(userId: string, currentPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) throw new NotFoundException('User not found');

    const storedPassword = String((user as any).password || '');
    const isValidPassword =
      storedPassword.length > 0 &&
      await bcrypt.compare(currentPassword, storedPassword);

    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    const deletionEmail = String((user as any).email || '').trim();
    const deletionFirstName = String((user as any).firstName || '').trim();

    // Project/account cleanup is fail-closed:
    // if project cleanup fails, DO NOT delete the User document.
    await this.projects.deleteAllForUser(userId);

    await this.userModel.findByIdAndDelete(userId).exec();

    // account-deletion-farewell-v1
    // The account is already deleted at this point. Email delivery is
    // best-effort and must never turn a successful deletion into a failure.
    if (deletionEmail) {
      try {
        await this.emailService.sendAccountDeletedEmail({
          to: deletionEmail,
          firstName: deletionFirstName || undefined,
        });
      } catch (error) {
        console.warn(
          'Account deleted successfully, but deletion confirmation email could not be sent.',
        );
      }
    }
  }
}

import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { ProjectsService } from '../projects/projects.service';
import { ActivitiesService } from '../activities/activities.service';
import { buildActivitySummary } from '../utils/activitySummary';

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
      .select('-password -resetToken -verificationToken')
      .exec();

    if (!user) return null;
    if ((user as any).publicProfile === false) return null;
    return user as any;
  }

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

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    const result = await this.userModel.findOne({ email }).exec();
    return result as any;
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

  // ✅ Deep-merge preferences safely
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

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument> {
    return this.update(userId, {
      profilePicture: avatarUrl,
      avatarUrl,
    });
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

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projects.findAll(userId);
    return {
      School: projects.filter((p: any) => p.category === 'School'),
      Job: projects.filter((p: any) => p.category === 'Job'),
      Personal: projects.filter((p: any) => p.category === 'Personal'),
    };
  }

  async updatePassword(
    email: string,
    newPasswordHash: string,
  ): Promise<UserDocument | null> {
    const result = await this.userModel
      .findOneAndUpdate({ email }, { password: newPasswordHash }, { new: true })
      .exec();
    return result as any;
  }

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
}

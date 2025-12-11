// src/user/user.service.ts
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { ProjectService } from '../projects/project.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @Inject(forwardRef(() => ProjectService))
    private readonly projects: ProjectService,
  ) {}

  /** -- Lookups -- */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  /** Public profile view (respect publicProfile flag) */
  async findPublicByUsername(username: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({ username })
      .select('-password -resetToken -verificationToken')
      .exec();

    if (!user) return null;
    if ((user as any).publicProfile === false) return null;
    return user;
  }

  /** -- Create/Update -- */
  async create(createUserDto: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /** Generic update by id (used by controller’s PATCH /users/me) */
  async updateById(id: string, patch: Partial<User>): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  /** Existing update helper (kept for compatibility) */
  async update(id: string, updateUserDto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updateUserDto);
    return user.save();
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

  /** -- Projects aggregation helper -- */
  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projects.findAll(userId);
    return {
      School: projects.filter((p: any) => p.category === 'School'),
      Job: projects.filter((p: any) => p.category === 'Job'),
      Personal: projects.filter((p: any) => p.category === 'Personal'),
    };
  }

  /** -- Auth helpers -- */
  async updatePassword(
    email: string,
    newPasswordHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ email }, { password: newPasswordHash }, { new: true })
      .exec();
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
    return user.save();
  }

  async getTopStreaks(limit = 10) {
    return this.userModel
      .find({}, { firstName: 1, streakDays: 1, profilePicture: 1 })
      .sort({ streakDays: -1 })
      .limit(limit)
      .exec();
  }

  // Simple stub so existing calls don't blow up
  async getActivitySummary(userId: string): Promise<any> {
    return {
      baseXp: 0,
      totalXp: 0,
      todayXp: 0,
      streakDays: 0,
      lastActiveAt: null,
      events: [],
    };
  }
}

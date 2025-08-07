import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { ProjectService } from '../projects/project.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private projectService: ProjectService,
  ) {}

  // ✅ NEW: Public profile support
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

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

  async findOneByEmail(email: string): Promise<UserDocument | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | undefined> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: any): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new Error('User not found');
    }
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
    },
  ): Promise<UserDocument> {
    return this.update(id, profileData);
  }

  async updateNotificationPreferences(id: string, preferences: string[]): Promise<UserDocument> {
    return this.update(id, { notificationPreferences: preferences });
  }

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projectService.findAll(userId);
    return {
      School: projects.filter(p => p.category === 'School'),
      Job: projects.filter(p => p.category === 'Job'),
      Personal: projects.filter(p => p.category === 'Personal'),
    };
  }

  async updatePassword(email: string, newPasswordHash: string): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { email },
      { password: newPasswordHash },
      { new: true }
    ).exec();
  }

  async trackLoginActivity(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new Error('User not found');

    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    const diffDays = last ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (diffDays === 1) {
      user.streakDays = (user.streakDays || 0) + 1;
    } else if (diffDays === 0) {
      // no change
    } else {
      user.streakDays = 1;
    }

    user.lastLogin = now;
    return user.save();
  }

  async getTopStreaks(limit = 10) {
    return this.userModel
      .find({}, { firstName: 1, streakDays: 1, profilePicture: 1 })
      .sort({ streakDays: -1 })
      .limit(limit)
      .exec();
  }
}

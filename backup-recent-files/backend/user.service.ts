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

  async create(createUserDto: { email: string; username: string; password: string; firstName: string; lastName: string }): Promise<UserDocument> {
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

  async updateProfile(id: string, profileData: { profilePicture?: string; bannerPicture?: string; school?: string; job?: string }): Promise<UserDocument> {
    return this.update(id, profileData);
  }

  async updateNotificationPreferences(id: string, preferences: string[]): Promise<UserDocument> {
    return this.update(id, { notificationPreferences: preferences });
  }

  async getProjectsByCategory(userId: string): Promise<any> {
    const projects = await this.projectService.findAll(userId);
    const categorizedProjects = {
      School: projects.filter(p => p.category === 'School'),
      Job: projects.filter(p => p.category === 'Job'),
      Personal: projects.filter(p => p.category === 'Personal'),
    };
    return categorizedProjects;
  }
}
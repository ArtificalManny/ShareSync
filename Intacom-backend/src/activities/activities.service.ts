import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>) {}

  async create(userId: string, projectId: string, action: string) {
    try {
      const activity = new this.activityModel({
        userId,
        projectId,
        action,
      });
      return await activity.save();
    } catch (error) {
      console.error('Error in create activity:', error);
      throw error;
    }
  }

  async findByUser(userId: string) {
    try {
      return await this.activityModel.find({ userId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      console.error('Error in findByUser:', error);
      throw error;
    }
  }

  async findByProject(projectId: string) {
    try {
      return await this.activityModel.find({ projectId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }
}
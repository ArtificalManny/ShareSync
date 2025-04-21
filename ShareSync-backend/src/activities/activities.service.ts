import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from '../schemas/activity.schema'; // Already correct

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel('Activity') private readonly activityModel: Model<Activity>) {}

  async create(userId: string, projectId: string, action: string): Promise<Activity> {
    const activity = new this.activityModel({ userId, projectId, action, timestamp: new Date() });
    return activity.save();
  }

  async findByUser(userId: string): Promise<Activity[]> {
    return this.activityModel.find({ userId }).exec();
  }

  async findByProject(projectId: string): Promise<Activity[]> {
    return this.activityModel.find({ projectId }).exec();
  }
}
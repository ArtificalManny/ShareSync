import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>) {}

  async create(activity: Partial<Activity>): Promise<Activity> {
    const newActivity = new this.activityModel(activity);
    return newActivity.save();
  }

  async findByUserId(userId: string): Promise<Activity[]> {
    return this.activityModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByProjectId(projectId: string): Promise<Activity[]> {
    return this.activityModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }
}
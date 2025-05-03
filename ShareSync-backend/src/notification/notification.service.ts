import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}

  async create(userId: string, message: string): Promise<Notification> {
    const notification = new this.notificationModel({ userId, message });
    return notification.save();
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async clear(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({ userId }).exec();
  }
}
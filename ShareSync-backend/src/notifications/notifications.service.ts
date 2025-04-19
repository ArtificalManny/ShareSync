import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel('Notification') private notificationModel: Model<Notification>) {}

  async createNotification(projectId: string, userId: string, message: string): Promise<Notification> {
    const notification = new this.notificationModel({ projectId, userId, message });
    return notification.save();
  }

  async getNotifications(projectId: string): Promise<Notification[]> {
    return this.notificationModel.find({ projectId }).sort({ timestamp: -1 }).exec();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationModel.updateOne({ _id: notificationId }, { $set: { read: true } }).exec();
  }
}
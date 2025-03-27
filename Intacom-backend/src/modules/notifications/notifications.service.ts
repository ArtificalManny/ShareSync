import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = new this.notificationModel(notification);
    // Mock email sending
    console.log(`Sending email to user ${notification.userId}: ${notification.message}`);
    return newNotification.save();
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
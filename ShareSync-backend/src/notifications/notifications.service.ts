import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(userId: string, message: string, type: string, relatedId?: string) {
    const notification = new this.notificationModel({
      userId,
      message,
      timestamp: new Date(),
      read: false,
      type,
      relatedId,
    });
    await notification.save();
    this.notificationsGateway.sendNotification(userId, message, type, relatedId);
    return notification;
  }

  async getNotifications(userId: string) {
    return this.notificationModel.find({ userId }).sort({ timestamp: -1 }).exec();
  }
}
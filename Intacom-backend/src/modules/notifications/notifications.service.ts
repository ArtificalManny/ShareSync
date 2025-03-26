import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.model';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

  async create(userId: string, message: string): Promise<Notification> {
    const newNotification = new this.notificationModel({ userId, message });
    return await newNotification.save();
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return await this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
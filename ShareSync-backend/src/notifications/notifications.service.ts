import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

  async createNotification(projectId: string, userId: string, message: string): Promise<Notification> {
    const notification = new this.notificationModel({ projectId, userId, message });
    return notification.save();
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).exec();
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.notificationModel.findByIdAndUpdate(id, { read: true }, { new: true }).exec();
  }
}
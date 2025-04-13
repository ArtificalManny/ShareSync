import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>
  ) {}

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ userId }).exec();
  }

  async markAsRead(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .exec();
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }
}import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>
  ) {}

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ userId }).exec();
  }

  async markAsRead(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .exec();
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }
}
import { Injectable } from '@nestjs/common'; // Line 1
import { InjectModel } from '@nestjs/mongoose'; // Line 2
import { Model } from 'mongoose'; // Line 3
import { Notification } from './notification.schema'; // Line 4

@Injectable() // Line 6
export class NotificationService { // Line 7
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {} // Line 8

  async getNotifications(userId: string): Promise<Notification[]> { // Line 10
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec(); // Line 11
  } // Line 12

  async markAsRead(notificationId: string): Promise<Notification> { // Line 14
    return this.notificationModel.findByIdAndUpdate( // Line 15
      notificationId, // Line 16
      { isRead: true }, // Line 17
      { new: true } // Line 18
    ).exec(); // Line 19
  } // Line 20

  // New method to create a notification // Line 22
  async createNotification(userId: string, message: string): Promise<Notification> { // Line 23
    const notification = new this.notificationModel({ userId, message }); // Line 24
    return notification.save(); // Line 25
  } // Line 26
} // Line 27
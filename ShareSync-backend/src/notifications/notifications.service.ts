import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async createNotification(recipient: string, message: string) {
    const notification = new this.notificationModel({ recipient, message });
    await notification.save();

    // Send email notification
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: 'New ShareSync Notification',
      text: message,
      html: `<p>${message}</p><p>Visit <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> to view.</p>`,
    });

    return notification;
  }

  async getNotifications(userId: string) {
    return this.notificationModel.find({ recipient: userId }).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true }).exec();
  }
}
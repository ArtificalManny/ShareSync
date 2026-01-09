import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notifications.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) 
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async create(data: {
    userId: string;
    projectId?: string;
    type: string;
    title: string;
    message: string;
    urgent?: boolean;
    actionData?: any;
    triggeredBy?: string;
  }): Promise<Notification> {
    const user = await this.userModel.findById(data.userId);
    if (!user) throw new Error('User not found');

    const prefs = (user as any).notificationSettings || {};

    const isQuietHours = this.isQuietHours(prefs.quietHours);

    const shouldSendInApp = this.shouldSendInApp(data.type, prefs.inApp);
    const shouldSendEmail = this.shouldSendEmail(data.type, prefs.email, isQuietHours);
    const shouldSendSms = this.shouldSendSms(data.urgent, prefs.sms, isQuietHours);

    const notification = new this.notificationModel({
      userId: new Types.ObjectId(data.userId),
      projectId: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
      type: data.type,
      title: data.title,
      message: data.message,
      urgent: data.urgent || false,
      actionData: data.actionData,
      triggeredBy: data.triggeredBy ? new Types.ObjectId(data.triggeredBy) : undefined,
      sentChannels: {
        inApp: shouldSendInApp,
        email: shouldSendEmail,
        sms: shouldSendSms,
      },
    });

    await notification.save();

    if (shouldSendEmail) {
      await this.emailService.sendNotification(user as any, notification);
    }

    if (shouldSendSms && (user as any).phoneNumber) {
      await this.smsService.sendNotification(
        (user as any).phoneNumber,
        notification
      );
    }

    return notification;
  }

  private isQuietHours(settings: any): boolean {
    if (!settings?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.start || '22:00';
    const end = settings.end || '08:00';

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      return currentTime >= start || currentTime < end;
    }
  }

  private shouldSendInApp(type: string, setting: string): boolean {
    if (setting === 'off') return false;
    if (setting === 'mentions') return type === 'mention';
    return true;
  }

  private shouldSendEmail(
    type: string,
    setting: string,
    isQuietHours: boolean
  ): boolean {
    if (setting === 'off') return false;
    if (setting === 'digest') return false;
    if (isQuietHours) return false;
    return true;
  }

  private shouldSendSms(
    urgent: boolean,
    setting: string,
    isQuietHours: boolean
  ): boolean {
    if (setting === 'off') return false;
    if (!urgent) return false;
    if (isQuietHours) return false;
    return true;
  }

  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (options.unreadOnly) {
      query.read = false;
    }

    // FIX: Split Promise.all to avoid TS2590
    const notificationsPromise = this.notificationModel
      .find(query)
      .populate('triggeredBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(options.limit || 10)
      .exec();

    const unreadCountPromise = this.notificationModel.countDocuments({ 
      userId: new Types.ObjectId(userId), 
      read: false 
    });

    // Execute in parallel with explicit typing
    const notifications = (await notificationsPromise) as any as Notification[];
    const unreadCount = await unreadCountPromise;

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { read: true, readAt: new Date() }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true, readAt: new Date() }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId)
    });
  }
}

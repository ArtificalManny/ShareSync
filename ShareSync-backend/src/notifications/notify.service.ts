// backend/src/notifications/notify.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class NotifyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async inApp(payload: {
    userId: string;
    title: string;
    message: string;
    href?: string;
    priority?: string;
    meta?: any;
  }) {
    await this.userModel.updateOne(
      { _id: payload.userId },
      {
        $push: {
          notifications: {
            title: payload.title,
            message: payload.message,
            href: payload.href,
            priority: payload.priority || 'normal',
            meta: payload.meta || {},
            read: false,
            createdAt: new Date(),
          },
        },
      },
    );
  }

  // NEW: Flush email batches
  async flushEmailBatches(): Promise<any> {
    console.log('[NotifyService] Flushing email batches...');
    // Implement real email sending here if needed
    return { sent: 0 };
  }
}
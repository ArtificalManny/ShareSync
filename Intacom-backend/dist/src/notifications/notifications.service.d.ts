import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(userId: string, type: string, message: string, relatedId?: string): Promise<import("mongoose").Document<unknown, {}, NotificationDocument> & Notification & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, NotificationDocument> & Notification & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    markAsRead(id: string): Promise<import("mongoose").Document<unknown, {}, NotificationDocument> & Notification & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}

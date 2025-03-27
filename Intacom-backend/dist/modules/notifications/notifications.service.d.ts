import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(notification: Partial<Notification>): Promise<Notification>;
    findByUserId(userId: string): Promise<Notification[]>;
}

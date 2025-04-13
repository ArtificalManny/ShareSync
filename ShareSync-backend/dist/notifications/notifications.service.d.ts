import { Model } from 'mongoose';
import { NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    findByUser(userId: string): Promise<NotificationDocument[]>;
    markAsRead(id: string): Promise<NotificationDocument>;
}
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    findByUser(userId: string): Promise<NotificationDocument[]>;
    markAsRead(id: string): Promise<NotificationDocument>;
}

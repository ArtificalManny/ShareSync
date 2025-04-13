import { Model } from 'mongoose';
import { NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(notification: {
        userId: string;
        content: string;
        read?: boolean;
        createdAt?: Date;
    }): Promise<NotificationDocument>;
    findByUser(userId: string): Promise<NotificationDocument[]>;
    markAsRead(id: string): Promise<NotificationDocument>;
}

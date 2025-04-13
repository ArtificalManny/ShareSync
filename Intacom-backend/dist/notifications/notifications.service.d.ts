import { Model } from 'mongoose';
import { NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(userId: string, type: string, message: string, relatedId?: string): Promise<any>;
    findByUser(userId: string): Promise<any[]>;
    markAsRead(id: string): Promise<any>;
}

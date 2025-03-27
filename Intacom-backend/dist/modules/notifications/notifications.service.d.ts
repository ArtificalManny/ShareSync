import { Model } from 'mongoose';
import { Notification } from './notification.model';
export declare class NotificationsService {
    private readonly notificationModel;
    constructor(notificationModel: Model<Notification>);
    create(userId: string, message: string): Promise<Notification>;
    findByUser(userId: string): Promise<Notification[]>;
}

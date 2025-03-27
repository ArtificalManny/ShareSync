import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    create(createNotificationDto: Partial<Notification>): Promise<Notification>;
    findByUserId(userId: string): Promise<Notification[]>;
}

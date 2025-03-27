import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findByUser(userId: string): Promise<{
        data: import("./notification.model").Notification[];
    }>;
}

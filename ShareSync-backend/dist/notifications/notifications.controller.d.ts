import { NotificationsService } from './notifications.service';
import { AppGateway } from '../app.gateway';
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly appGateway;
    constructor(notificationsService: NotificationsService, appGateway: AppGateway);
    findByUserId(userId: string): Promise<{
        status: string;
        data: import("./schemas/notification.schema").NotificationDocument[];
    }>;
    markAsRead(id: string): Promise<{
        status: string;
        message: string;
        data: import("./schemas/notification.schema").NotificationDocument;
    }>;
}

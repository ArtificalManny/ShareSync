import { NotificationsService } from './notifications.service';
import { AppGateway } from '../app.gateway';
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly appGateway;
    constructor(notificationsService: NotificationsService, appGateway: AppGateway);
    findByUserId(userId: string): Promise<{
        status: string;
        data: any;
    }>;
    markAsRead(id: string): Promise<{
        status: string;
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").NotificationDocument> & import("./schemas/notification.schema").Notification & import("mongoose").Document<unknown, any, any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
}

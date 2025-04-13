import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").NotificationDocument> & import("./schemas/notification.schema").Notification & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    markAsRead(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").NotificationDocument> & import("./schemas/notification.schema").Notification & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}

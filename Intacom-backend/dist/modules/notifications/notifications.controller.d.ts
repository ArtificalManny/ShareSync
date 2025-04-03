import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").NotificationDocument> & import("./schemas/notification.schema").Notification & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    markAsRead(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/notification.schema").NotificationDocument> & import("./schemas/notification.schema").Notification & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}

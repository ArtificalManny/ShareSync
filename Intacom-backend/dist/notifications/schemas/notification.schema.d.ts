import { Document } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare class Notification {
    userId: string;
    type: string;
    message: string;
    isRead: boolean;
    relatedId: string;
}
export declare const NotificationSchema: any;

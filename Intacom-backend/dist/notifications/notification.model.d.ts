import { Document } from 'mongoose';
export declare class Notification extends Document {
    userId: string;
    message: string;
    createdAt: Date;
}
export declare const NotificationSchema: any;

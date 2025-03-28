import { Document } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare class Notification {
    userId: string;
    message: string;
    type?: string;
    projectId?: string;
    action?: 'accept' | 'decline';
    status?: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification> & Notification & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>> & import("mongoose").FlatRecord<Notification> & {
    _id: import("mongoose").Types.ObjectId;
}>;

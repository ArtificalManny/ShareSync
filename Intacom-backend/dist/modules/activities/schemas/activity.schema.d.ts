import { Document } from 'mongoose';
export type ActivityDocument = Activity & Document;
export declare class Activity {
    userId: string;
    type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'profile_update' | 'member_request' | 'member_approved';
    content: string;
    projectId?: string;
    createdAt: Date;
}
export declare const ActivitySchema: import("mongoose").Schema<Activity, import("mongoose").Model<Activity, any, any, any, Document<unknown, any, Activity> & Activity & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Activity, Document<unknown, {}, import("mongoose").FlatRecord<Activity>> & import("mongoose").FlatRecord<Activity> & {
    _id: import("mongoose").Types.ObjectId;
}>;

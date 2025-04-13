import { Document } from 'mongoose';
export type ActivityDocument = Activity & Document;
export declare class Activity {
    userId: string;
    type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'profile_update' | 'member_request' | 'member_approved';
    content: string;
    projectId?: string;
    createdAt: Date;
}
export declare const ActivitySchema: any;

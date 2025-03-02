import { Document } from 'mongoose';
export declare class Project extends Document {
    name: string;
    description: string;
    admin: string;
    sharedWith?: string[];
    announcements?: {
        id: number;
        content: string;
        media: string;
        likes: number;
        comments: {
            user: string;
            text: string;
        }[];
        user: string;
    }[];
    tasks?: {
        id: number;
        title: string;
        assignee: string;
        dueDate: Date;
        status: string;
        comments: {
            user: string;
            text: string;
        }[];
        user: string;
    }[];
}
export declare const ProjectSchema: any;

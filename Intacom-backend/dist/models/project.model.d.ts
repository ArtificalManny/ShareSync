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
export declare const ProjectSchema: import("mongoose").Schema<Project, import("mongoose").Model<Project, any, any, any, Document<unknown, any, Project> & Project & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Project, Document<unknown, {}, import("mongoose").FlatRecord<Project>> & import("mongoose").FlatRecord<Project> & {
    _id: import("mongoose").Types.ObjectId;
}>;

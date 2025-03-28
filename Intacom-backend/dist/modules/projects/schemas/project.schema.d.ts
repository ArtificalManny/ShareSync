import { Document } from 'mongoose';
export type ProjectDocument = Project & Document;
export declare class Project {
    name: string;
    description?: string;
    admin?: string;
    color?: string;
    sharedWith?: {
        userId: string;
        role: 'Admin' | 'Editor' | 'Viewer';
    }[];
    memberRequests?: {
        userId: string;
        requestedBy: string;
        status: 'pending' | 'approved' | 'denied';
    }[];
}
export declare const ProjectSchema: import("mongoose").Schema<Project, import("mongoose").Model<Project, any, any, any, Document<unknown, any, Project> & Project & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Project, Document<unknown, {}, import("mongoose").FlatRecord<Project>> & import("mongoose").FlatRecord<Project> & {
    _id: import("mongoose").Types.ObjectId;
}>;

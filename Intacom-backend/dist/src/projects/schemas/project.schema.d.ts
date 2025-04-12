import { Document } from 'mongoose';
export type ProjectDocument = Project & Document;
export declare class Project {
    name: string;
    description: string;
    admin: string;
    sharedWith: {
        userId: string;
        role: string;
    }[];
    status: string;
    color: string;
    tasks: string[];
    timeline: {
        startDate: string;
        endDate: string;
        milestones: {
            name: string;
            date: string;
        }[];
    };
    likes: number;
    comments: number;
}
export declare const ProjectSchema: import("mongoose").Schema<Project, import("mongoose").Model<Project, any, any, any, Document<unknown, any, Project> & Project & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Project, Document<unknown, {}, import("mongoose").FlatRecord<Project>> & import("mongoose").FlatRecord<Project> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

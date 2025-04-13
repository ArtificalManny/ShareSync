import { Document } from 'mongoose';
export type ProjectDocument = Project & Document;
export declare class Project {
    name: string;
    description: string;
    creatorEmail: string;
    createdAt: Date;
    timeline: {
        date: string;
        event: string;
    }[];
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

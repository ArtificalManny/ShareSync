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
export declare const ProjectSchema: any;

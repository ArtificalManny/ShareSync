import { Document } from 'mongoose';
export declare class Project extends Document {
    name: string;
    description: string;
    admin: string;
    color: string;
    sharedWith: {
        userId: string;
        role: 'Admin' | 'Editor' | 'Viewer';
    }[];
}
export declare const ProjectSchema: any;

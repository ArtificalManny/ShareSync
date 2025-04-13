import { Document } from 'mongoose';
export type ActivityDocument = Activity & Document;
export declare class Activity {
    userId: string;
    projectId: string;
    action: string;
}
export declare const ActivitySchema: any;

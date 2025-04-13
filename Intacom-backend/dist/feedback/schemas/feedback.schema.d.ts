import { Document } from 'mongoose';
export type FeedbackDocument = Feedback & Document;
export declare class Feedback {
    userId: string;
    projectId: string;
    message: string;
    rating: number;
}
export declare const FeedbackSchema: any;

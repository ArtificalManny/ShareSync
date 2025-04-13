import { Document } from 'mongoose';
export type FeedbackDocument = Feedback & Document;
export declare class Feedback {
    userId: string;
    projectId: string;
    message: string;
    rating: number;
}
export declare const FeedbackSchema: import("mongoose").Schema<Feedback, import("mongoose").Model<Feedback, any, any, any, Document<unknown, any, Feedback> & Feedback & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Feedback, Document<unknown, {}, import("mongoose").FlatRecord<Feedback>> & import("mongoose").FlatRecord<Feedback> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

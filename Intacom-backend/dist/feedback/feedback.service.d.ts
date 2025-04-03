import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
export declare class FeedbackService {
    private feedbackModel;
    constructor(feedbackModel: Model<FeedbackDocument>);
    create(userId: string, projectId: string, message: string, rating: number): Promise<import("mongoose").Document<unknown, {}, FeedbackDocument> & Feedback & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, FeedbackDocument> & Feedback & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
}

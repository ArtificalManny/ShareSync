import { Model } from 'mongoose';
import { FeedbackDocument } from './schemas/feedback.schema';
export declare class FeedbackService {
    private feedbackModel;
    constructor(feedbackModel: Model<FeedbackDocument>);
    create(userId: string, projectId: string, message: string, rating: number): Promise<any>;
    findByProject(projectId: string): Promise<any[]>;
}

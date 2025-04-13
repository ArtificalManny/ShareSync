import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
export declare class FeedbackService {
    private feedbackModel;
    constructor(feedbackModel: Model<FeedbackDocument>);
    create(projectId: string, userId: string, rating: number, message: string): Promise<Feedback>;
    findByProject(projectId: string): Promise<Feedback[]>;
    findByProjectId(projectId: string): Promise<Feedback[]>;
    delete(id: string): Promise<{
        message: string;
    }>;
}

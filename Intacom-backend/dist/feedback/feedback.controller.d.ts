import { FeedbackService } from './feedback.service';
import { Feedback } from './schemas/feedback.schema';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(projectId: string, userId: string, rating: number, message: string): Promise<{
        message: string;
        data: Feedback;
    }>;
    findByProjectId(projectId: string): Promise<{
        data: Feedback[];
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}

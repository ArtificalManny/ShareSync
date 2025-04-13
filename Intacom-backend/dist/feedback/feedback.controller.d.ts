import { FeedbackService } from './feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(projectId: string, userId: string, rating: number, message: string): Promise<{
        message: string;
        data: any;
    }>;
    findByProjectId(projectId: string): Promise<{
        data: any;
    }>;
    delete(id: string): Promise<any>;
}

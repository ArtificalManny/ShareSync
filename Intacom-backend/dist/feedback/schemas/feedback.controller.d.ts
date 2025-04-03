import { FeedbackService } from './feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(userId: string, projectId: string, message: string, rating: number): Promise<any>;
    findByProject(projectId: string): Promise<any[]>;
}

import { FeedbackService } from './feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(userId: string, projectId: string, message: string, rating: number): Promise<import("mongoose").Document<unknown, {}, import("./schemas/feedback.schema").FeedbackDocument> & import("./schemas/feedback.schema").Feedback & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/feedback.schema").FeedbackDocument> & import("./schemas/feedback.schema").Feedback & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
}

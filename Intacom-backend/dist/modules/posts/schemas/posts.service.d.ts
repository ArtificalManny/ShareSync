import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
export declare class PostsService {
    private postModel;
    private notificationsService;
    private pointsService;
    constructor(postModel: Model<PostDocument>, notificationsService: NotificationsService, pointsService: PointsService);
    create(projectId: string, userId: string, content: string, images: string[]): Promise<any>;
    findByProject(projectId: string): Promise<any[]>;
    update(id: string, updates: Partial<Post>): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
    likePost(id: string, userId: string): Promise<{
        message: string;
    }>;
}

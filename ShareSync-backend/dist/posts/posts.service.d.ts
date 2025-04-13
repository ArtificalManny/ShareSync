import { Model } from 'mongoose';
import { PostDocument } from './schemas/post.schema';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PostsService {
    private postModel;
    private projectModel;
    private readonly notificationsService;
    constructor(postModel: Model<PostDocument>, projectModel: Model<ProjectDocument>, notificationsService: NotificationsService);
    create(post: {
        content: string;
        projectId: string;
        userId: string;
    }): Promise<PostDocument>;
    findByProject(projectId: string): Promise<PostDocument[]>;
    like(postId: string, userId: string): Promise<PostDocument>;
}

import { PostsService } from './posts.service';
import { AppGateway } from '../app.gateway';
export declare class PostsController {
    private readonly postsService;
    private readonly appGateway;
    constructor(postsService: PostsService, appGateway: AppGateway);
    create(post: {
        content: string;
        projectId: string;
        userId: string;
    }): Promise<{
        status: string;
        message: string;
        data: import("./schemas/post.schema").PostDocument;
    }>;
    findByProjectId(projectId: string): Promise<{
        status: string;
        data: import("./schemas/post.schema").PostDocument[];
    }>;
    update(id: string, updates: Partial<{
        content: string;
    }>): Promise<import("./schemas/post.schema").PostDocument>;
    delete(id: string): Promise<void>;
    like(id: string, userId: string): Promise<import("./schemas/post.schema").PostDocument>;
}

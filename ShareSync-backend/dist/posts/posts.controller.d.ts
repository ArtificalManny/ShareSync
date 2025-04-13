import { PostsService } from './posts.service';
import { Post as PostInterface } from './types/post.interface';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: {
        projectId: string;
        userId: string;
        content: string;
        images: string[];
    }): Promise<import("./schemas/post.schema").PostDocument>;
    findByProjectId(projectId: string): Promise<{
        data: any;
    }>;
    update(id: string, updates: Partial<PostInterface>): Promise<any>;
    delete(id: string): Promise<any>;
    likePost(id: string, userId: string): Promise<any>;
}

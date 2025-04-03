import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(projectId: string, userId: string, content: string, images: string[]): Promise<import("./schemas/post.schema").Post>;
    findByProject(projectId: string): Promise<any>;
    update(id: string, updates: Partial<Post>): Promise<import("./schemas/post.schema").Post>;
    delete(id: string): Promise<void>;
    likePost(id: string, userId: string): Promise<any>;
}

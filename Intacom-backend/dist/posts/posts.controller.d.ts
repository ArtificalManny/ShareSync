import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(projectId: string, userId: string, content: string, images: string[]): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByProject(projectId: string): Promise<any>;
    update(id: string, updates: Partial<Post>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    likePost(id: string, userId: string): Promise<{
        message: string;
    }>;
}

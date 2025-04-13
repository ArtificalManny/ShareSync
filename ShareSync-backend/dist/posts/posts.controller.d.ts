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
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByProjectId(projectId: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<unknown, any, any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
    update(id: string, updates: Partial<PostInterface>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    likePost(id: string, userId: string): Promise<{
        message: string;
    }>;
}

import { PostsService } from './posts.service';
import { Post as PostInterface } from '../posts/types/post.interface';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: {
        projectId: string;
        userId: string;
        content: string;
        images: string[];
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByProjectId(projectId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    update(id: string, updates: Partial<PostInterface>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").PostDocument> & import("./schemas/post.schema").Post & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    likePost(id: string, userId: string): Promise<{
        message: string;
    }>;
}

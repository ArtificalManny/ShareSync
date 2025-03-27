import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
export declare class PostsService {
    private postModel;
    constructor(postModel: Model<PostDocument>);
    create(post: Partial<Post>): Promise<Post>;
    findByProjectId(projectId: string): Promise<Post[]>;
    update(id: string, updatePostDto: Partial<Post>): Promise<Post | null>;
    delete(id: string): Promise<void>;
}

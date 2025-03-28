import { PostsService } from './posts.service';
import { Post as PostModel } from './schemas/post.schema';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: Partial<PostModel>): Promise<PostModel>;
    findByProjectId(projectId: string): Promise<PostModel[]>;
    update(id: string, updatePostDto: Partial<PostModel>): Promise<PostModel>;
    delete(id: string): Promise<void>;
}

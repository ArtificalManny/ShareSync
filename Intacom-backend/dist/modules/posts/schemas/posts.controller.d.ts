import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: {
        projectId: string;
        userId: string;
        content: string;
        images: string[];
    }): Promise<any>;
    findByProjectId(projectId: string): Promise<any>;
    update(id: string, updates: Partial<Post>): Promise<any>;
    delete(id: string): Promise<any>;
}

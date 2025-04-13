import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
export declare class PostsService {
    private postModel;
    private projectModel;
    private notificationsService;
    private pointsService;
    constructor(postModel: Model<PostDocument>, projectModel: Model<ProjectDocument>, notificationsService: NotificationsService, pointsService: PointsService);
    create(createPostDto: {
        projectId: string;
        userId: string;
        content: string;
        images: string[];
    }): Promise<import("mongoose").Document<unknown, {}, PostDocument> & Post & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByProjectId(projectId: string): Promise<(import("mongoose").Document<unknown, {}, PostDocument> & Post & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    update(id: string, updates: Partial<Post>): Promise<import("mongoose").Document<unknown, {}, PostDocument> & Post & import("mongoose").Document<unknown, any, any> & Required<{
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

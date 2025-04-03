import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
export declare class ProjectsService {
    private projectModel;
    private notificationsService;
    private pointsService;
    constructor(projectModel: Model<ProjectDocument>, notificationsService: NotificationsService, pointsService: PointsService);
    create(name: string, description: string, admin: string, color: string, sharedWith: {
        userId: string;
        role: string;
    }[]): Promise<any>;
    findByUsername(username: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    update(id: string, updates: Partial<Project>): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
    likeProject(id: string, userId: string): Promise<{
        message: string;
    }>;
}

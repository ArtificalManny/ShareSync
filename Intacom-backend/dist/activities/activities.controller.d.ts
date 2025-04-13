import { ActivitiesService } from './activities.service';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    create(userId: string, projectId: string, action: string): Promise<any>;
    findByUser(userId: string): Promise<any>;
    findByProject(projectId: string): Promise<any>;
}

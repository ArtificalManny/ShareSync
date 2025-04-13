import { ActivitiesService } from './activities.service';
import { Activity } from './schemas/activity.schema';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    create(createActivityDto: Partial<Activity>): Promise<Activity>;
    findByUserId(userId: string): Promise<Activity[]>;
    findByProjectId(projectId: string): Promise<Activity[]>;
}

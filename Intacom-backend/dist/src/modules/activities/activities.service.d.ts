import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
export declare class ActivitiesService {
    private activityModel;
    constructor(activityModel: Model<ActivityDocument>);
    create(activity: Partial<Activity>): Promise<Activity>;
    findByUserId(userId: string): Promise<Activity[]>;
    findByProjectId(projectId: string): Promise<Activity[]>;
}

import { Model } from 'mongoose';
import { ActivityDocument } from './schemas/activity.schema';
export declare class ActivitiesService {
    private activityModel;
    constructor(activityModel: Model<ActivityDocument>);
    create(userId: string, projectId: string, action: string): Promise<any>;
    findByUser(userId: string): Promise<any[]>;
    findByProject(projectId: string): Promise<any[]>;
}

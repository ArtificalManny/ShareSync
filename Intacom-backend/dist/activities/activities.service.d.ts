import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
export declare class ActivitiesService {
    private activityModel;
    constructor(activityModel: Model<ActivityDocument>);
    create(userId: string, projectId: string, action: string): Promise<import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
}

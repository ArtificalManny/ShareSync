import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
export declare class ActivitiesService {
    private activityModel;
    constructor(activityModel: Model<ActivityDocument>);
    create(userId: string, projectId: string, action: string): Promise<import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, ActivityDocument> & Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
}

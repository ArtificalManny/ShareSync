import { ActivitiesService } from './activities.service';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    create(userId: string, projectId: string, action: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/activity.schema").ActivityDocument> & import("./schemas/activity.schema").Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/activity.schema").ActivityDocument> & import("./schemas/activity.schema").Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/activity.schema").ActivityDocument> & import("./schemas/activity.schema").Activity & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
}

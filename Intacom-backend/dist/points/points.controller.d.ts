import { PointsService } from './points.service';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    getLeaderboard(): Promise<(import("mongoose").Document<unknown, {}, import("../users/schemas/user.schema").UserDocument> & import("../users/schemas/user.schema").User & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
}

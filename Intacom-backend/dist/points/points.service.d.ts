import { Model } from 'mongoose';
import { Point, PointDocument } from './schemas/point.schema';
import { UsersService } from '../users/users.service';
export declare class PointsService {
    private pointModel;
    private usersService;
    constructor(pointModel: Model<PointDocument>, usersService: UsersService);
    addPoints(userId: string, points: number, action: string): Promise<import("mongoose").Document<unknown, {}, PointDocument> & Point & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    getLeaderboard(): Promise<import("../users/schemas/user.schema").User[]>;
}

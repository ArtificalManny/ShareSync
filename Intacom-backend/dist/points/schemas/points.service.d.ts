import { Model } from 'mongoose';
import { PointDocument } from './schemas/point.schema';
import { UsersService } from '../users/users.service';
export declare class PointsService {
    private pointModel;
    private usersService;
    constructor(pointModel: Model<PointDocument>, usersService: UsersService);
    addPoints(userId: string, points: number, action: string): Promise<any>;
    getLeaderboard(): Promise<any>;
}

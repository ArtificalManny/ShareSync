import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
export declare class PointsService {
    private readonly userModel;
    constructor(userModel: Model<User>);
    addPoints(userId: string, points: number, reason?: string): Promise<void>;
    getLeaderboard(): Promise<User[]>;
}

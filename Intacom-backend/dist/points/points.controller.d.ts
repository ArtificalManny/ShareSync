import { PointsService } from './points.service';
import { User } from '../users/schemas/user.schema';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    getLeaderboard(): Promise<User[]>;
}

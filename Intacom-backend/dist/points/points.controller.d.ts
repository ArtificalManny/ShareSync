import { PointsService } from './points.service';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    getLeaderboard(): Promise<{
        status: string;
        data: any;
    }>;
}

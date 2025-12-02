/**
 * cursor-metrics.service.ts
 * Backend analytics service for cursor metrics
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cursor, CursorDocument } from '../realtime/schemas/cursor.schema';

@Injectable()
export class CursorMetricsService {
  constructor(
    @InjectModel(Cursor.name) private cursorModel: Model<CursorDocument>,
  ) {}

  async getProjectMetrics(projectId: Types.ObjectId, timeWindow: number = 86400000) {
    const since = new Date(Date.now() - timeWindow);

    const totalMovements = await this.cursorModel.countDocuments({
      projectId,
      timestamp: { $gte: since },
    });

    const uniqueUsers = await this.cursorModel.aggregate([
      { $match: { projectId, timestamp: { $gte: since } } },
      { $group: { _id: '$userId' } },
      { $count: 'count' },
    ]);

    return {
      totalMovements,
      uniqueUsers: uniqueUsers[0]?.count || 0,
      averagePerUser: totalMovements / (uniqueUsers[0]?.count || 1),
    };
  }

  async calculateDensityMap(projectId: Types.ObjectId, gridSize: number = 20) {
    const cursors = await this.cursorModel
      .find({ projectId })
      .select('x y')
      .lean();

    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    cursors.forEach(c => {
      const x = Math.floor((c.x / 100) * gridSize);
      const y = Math.floor((c.y / 100) * gridSize);
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) grid[y][x]++;
    });

    return grid;
  }
}
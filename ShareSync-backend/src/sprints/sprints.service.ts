import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';

type AnyObj = Record<string, any>;

@Injectable()
export class SprintsService {
  private readonly logger = new Logger(SprintsService.name);

  constructor(
    @InjectModel('Sprint') private readonly sprintModel?: Model<AnyObj>,
  ) {}

  /**
   * Return per-day completion counts for last N days.
   * If no model is wired, returns a dev-friendly mock in non-production.
   */
  async completionsByDay({
    userId,
    projectId,
    range = 28,
  }: { userId?: string; projectId?: string; range?: number }) {
    if (!this.sprintModel) {
      if (process.env.NODE_ENV !== 'production') {
        const out: { date: string; count: number }[] = [];
        const now = new Date();
        for (let i = range - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(now.getDate() - i);
          out.push({ date: d.toISOString().slice(0,10), count: Math.round(Math.random() * 3) });
        }
        return out;
      }
      return [];
    }

    const since = new Date(); since.setDate(since.getDate() - (range - 1));
    const q: FilterQuery<AnyObj> = {
      finishedAt: { $gte: since },
      status: 'completed',
    };
    if (userId) (q as any).userId = userId;
    if (projectId) (q as any).projectId = projectId;

    const rows = await this.sprintModel
      .find(q, { finishedAt: 1 })
      .sort({ finishedAt: 1 })
      .lean()
      .exec();

    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = new Date(r.finishedAt).toISOString().slice(0,10);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    // Ensure all days present
    const out: { date: string; count: number }[] = [];
    const cur = new Date(since);
    const end = new Date();
    while (cur <= end) {
      const key = cur.toISOString().slice(0,10);
      out.push({ date: key, count: counts.get(key) || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return out.slice(-range);
  }
}

// src/stats/stats.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

type Activity = {
  projectId: string;
  userId?: string;
  type?: string;
  createdAt: string | Date;
};

type Task = {
  projectId: string;
  status?: string;
  completedAt?: string | Date | null;
  dueDate?: string | Date | null;
  createdAt?: string | Date | null;
};

export type ProjectStats = {
  cadence?: { value: number };
  throughputPerWeek?: { value: number };
  activeDays?: { value: number };
  onTimeCompletion?: { value: number };
  insights: {
    streakDays: number;
    peakHourLocal: number | null;
    peakDayOfWeek: number | null;
    throughputChangePct: number | null;
    summary: string[];
  };
};

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Task') private readonly taskModel: Model<any>,
  ) {}

  // ─── recalculateForUser ──────────────────────────────────────────────
  // Queries real task data, computes dashboard metrics, caches on user doc.
  // Called on task completion events and on GET /users/me/stats if stale.
  // ─────────────────────────────────────────────────────────────────────
  async recalculateForUser(userId: string): Promise<any> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    try {
      // Ships this week (last 7 days)
      const weeklyShips = await this.taskModel.countDocuments({
        $or: [
          { assignedTo: userId },
          { completedBy: userId },
          { userId: userId },
        ],
        status: { $in: ['completed', 'done', 'Done', 'Completed'] },
        completedAt: { $gte: sevenDaysAgo },
      });

      // Ships last week (7-14 days ago)
      const lastWeekShips = await this.taskModel.countDocuments({
        $or: [
          { assignedTo: userId },
          { completedBy: userId },
          { userId: userId },
        ],
        status: { $in: ['completed', 'done', 'Done', 'Completed'] },
        completedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      });

      // Completion rate: completed / total assigned
      const totalAssigned = await this.taskModel.countDocuments({
        $or: [
          { assignedTo: userId },
          { userId: userId },
        ],
      });
      const totalCompleted = await this.taskModel.countDocuments({
        $or: [
          { assignedTo: userId },
          { completedBy: userId },
          { userId: userId },
        ],
        status: { $in: ['completed', 'done', 'Done', 'Completed'] },
      });
      const completionRate = totalAssigned > 0
        ? Math.round((totalCompleted / totalAssigned) * 100)
        : 0;

      // Efficiency: ((thisWeek - lastWeek) / lastWeek) * 100
      let efficiency = 0;
      if (lastWeekShips > 0) {
        efficiency = Math.round(((weeklyShips - lastWeekShips) / lastWeekShips) * 100);
      } else if (weeklyShips > 0) {
        efficiency = 100; // went from 0 to something
      }

      // Streak: count consecutive days with at least one completion
      // Walk backward from today
      let streakDays = 0;
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let i = 0; i < 365; i++) {
        const dayStart = new Date(todayMidnight.getTime() - i * 86400000);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const hasActivity = await this.taskModel.countDocuments({
          $or: [
            { completedBy: userId },
            { userId: userId },
          ],
          completedAt: { $gte: dayStart, $lt: dayEnd },
        });
        if (hasActivity > 0) {
          streakDays++;
        } else if (i === 0) {
          // Today has no activity yet — check if yesterday had activity
          continue;
        } else {
          break;
        }
      }

      // Update user document with cached stats
      const updatePayload = {
        weeklyShips,
        lastWeekShips,
        completionRate,
        statsLastCalculated: now,
        streakDays,
        totalShips: totalCompleted,
        totalTasksCompleted: totalCompleted,
      };

      await this.userModel.findByIdAndUpdate(userId, { $set: updatePayload });

      this.logger.log(
        `[Stats] Recalculated for user ${userId}: ships=${weeklyShips}, streak=${streakDays}, completion=${completionRate}%, efficiency=${efficiency}%`,
      );

      return {
        ships: weeklyShips,
        streakDays,
        focus: completionRate,
        efficiency,
        weeklyShips,
        lastWeekShips,
        completionRate,
        totalShips: totalCompleted,
        statsLastCalculated: now,
      };
    } catch (err) {
      this.logger.error(`[Stats] recalculateForUser failed for ${userId}:`, err?.message || err);
      return {
        ships: 0,
        streakDays: 0,
        focus: 0,
        efficiency: 0,
        weeklyShips: 0,
        lastWeekShips: 0,
        completionRate: 0,
        totalShips: 0,
        statsLastCalculated: now,
      };
    }
  }

  // MOCK DATA — Replace with real DB later
  private mockActivities: Activity[] = [
    { projectId: "1", type: "task.completed", createdAt: new Date() },
    { projectId: "1", type: "update.posted", createdAt: new Date(Date.now() - 86400000) },
    { projectId: "1", type: "task.completed", createdAt: new Date(Date.now() - 2 * 86400000) },
  ];

  private mockTasks: Task[] = [
    { projectId: "1", status: "Done", completedAt: new Date(), dueDate: new Date() },
    { projectId: "1", status: "Done", completedAt: new Date(Date.now() - 86400000), dueDate: new Date(Date.now() - 86400000) },
  ];

  async getProjectActivities(projectId: string, sinceDays = 60): Promise<Activity[]> {
    return this.mockActivities.filter(a => a.projectId === projectId);
  }

  async getProjectTasks(projectId: string, sinceDays = 60): Promise<Task[]> {
    return this.mockTasks.filter(t => t.projectId === projectId);
  }

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    return this.computeProjectStats(projectId);
  }

  async computeProjectStats(projectId: string): Promise<ProjectStats> {
    const now = new Date();
    const [activities, tasks] = await Promise.all([
      this.getProjectActivities(projectId, 60),
      this.getProjectTasks(projectId, 60),
    ]);

    const acts = activities
      .map(a => ({ ...a, createdAt: new Date(a.createdAt) }))
      .filter(a => !isNaN(a.createdAt.getTime())) as Array<Activity & { createdAt: Date }>;

    const tks = tasks.map(t => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : null,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
    }));

    const windowDays = 28;
    const since = new Date(now.getTime() - windowDays * 86400000);
    const activeDaySet = new Set(
      acts
        .filter(a => a.createdAt >= since)
        .map(a => new Date(a.createdAt.getFullYear(), a.createdAt.getMonth(), a.createdAt.getDate()).toISOString()),
    );
    const cadenceValue = activeDaySet.size / windowDays;

    const last7 = new Date(now.getTime() - 7 * 86400000);
    const completedLast7 = tks.filter(t => t.completedAt && t.completedAt >= last7).length;

    const last30 = new Date(now.getTime() - 30 * 86400000);
    const completedLast30 = tks.filter(t => t.completedAt && t.completedAt >= last30);
    const onTimeNumer = completedLast30.filter(t => t.dueDate && t.completedAt! <= t.dueDate!).length;
    const onTimeDenom = completedLast30.length || 1;
    const onTimeValue = onTimeNumer / onTimeDenom;

    const dayHasActivity = new Set(acts.map(a => new Date(a.createdAt.getFullYear(), a.createdAt.getMonth(), a.createdAt.getDate()).toISOString()));
    let streak = 0;
    let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dayHasActivity.has(cursor.toISOString())) {
      streak = 1;
      for (let i = 1; i < 200; i++) {
        const d = new Date(cursor.getTime() - i * 86400000);
        if (dayHasActivity.has(d.toISOString())) streak++;
        else break;
      }
    }

    const hourBuckets = new Array(24).fill(0);
    acts.forEach(a => hourBuckets[a.createdAt.getHours()] += 1);
    const peakHourLocal = hourBuckets.some(v => v > 0) ? hourBuckets.indexOf(Math.max(...hourBuckets)) : null;

    const dowBuckets = new Array(7).fill(0);
    acts.forEach(a => dowBuckets[a.createdAt.getDay()] += 1);
    const peakDayOfWeek = dowBuckets.some(v => v > 0) ? dowBuckets.indexOf(Math.max(...dowBuckets)) : null;

    const prev7Start = new Date(last7.getTime() - 7 * 86400000);
    const prev7Count = tks.filter(t => t.completedAt && t.completedAt >= prev7Start && t.completedAt < last7).length;
    let throughputChangePct: number | null = null;
    if (prev7Count === 0 && completedLast7 === 0) throughputChangePct = 0;
    else if (prev7Count === 0 && completedLast7 > 0) throughputChangePct = 1;
    else throughputChangePct = (completedLast7 - prev7Count) / Math.max(1, prev7Count);

    const humanDow = (d: number | null) =>
      d == null ? '—' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
    const summary: string[] = [];

    summary.push(streak > 0 ? `You’re on a ${streak}-day activity streak.` : `No activity yet today—start something small to build momentum.`);
    summary.push(peakHourLocal == null ? `No peak hour yet—once activity flows in, we’ll surface your most productive time.` : `Most activity happens around ${peakHourLocal}:00.`);
    summary.push(peakDayOfWeek == null ? `No peak day yet.` : `You’re most active on ${humanDow(peakDayOfWeek)}.`);
    if (throughputChangePct == null) {
      summary.push(`Throughput trend is not available yet.`);
    } else {
      const pct = Math.round(throughputChangePct * 100);
      if (pct > 0) summary.push(`Throughput is up ${pct}% vs the previous week.`);
      else if (pct < 0) summary.push(`Throughput is down ${Math.abs(pct)}% vs the previous week.`);
      else summary.push(`Throughput is flat week-over-week.`);
    }

    return {
      cadence: { value: Number.isFinite(cadenceValue) ? cadenceValue : 0 },
      throughputPerWeek: { value: completedLast7 },
      activeDays: { value: activeDaySet.size },
      onTimeCompletion: { value: Number.isFinite(onTimeValue) ? onTimeValue : 0 },
      insights: {
        streakDays: streak,
        peakHourLocal,
        peakDayOfWeek,
        throughputChangePct,
        summary,
      },
    };
  }

  async getUserStats(userId: string, opts?: { range?: number; projectId?: string }): Promise<any> {
    const base = {
      userId,
      range: opts?.range ?? 30,
      projectId: opts?.projectId ?? null,
    };

    if (opts?.projectId) {
      const project = await this.computeProjectStats(opts.projectId);
      return { ...base, ...project };
    }

    return {
      ...base,
      cadence: { value: 0 },
      throughputPerWeek: { value: 0 },
      activeDays: { value: 0 },
      onTimeCompletion: { value: 0 },
      insights: {
        streakDays: 0,
        peakHourLocal: null,
        peakDayOfWeek: null,
        throughputChangePct: 0,
        summary: [],
      },
    };
  }

  async getTopMomentum(limit: number) {
    // MOCK DATA
    return [
      { id: "1", name: "Manny", streak: 7, last7Activity: [1, 2, 1, 3, 2, 1, 4] },
      { id: "2", name: "Alex", streak: 5, last7Activity: [0, 1, 1, 2, 1, 0, 3] },
    ];
  }
}
// src/stats/stats.service.ts
import { Injectable, Logger } from '@nestjs/common';

type Activity = {
  projectId: string;
  userId?: string;
  type?: string;           // e.g., 'update.posted' | 'task.completed' | ...
  createdAt: string | Date;
};

type Task = {
  projectId: string;
  status?: string;         // 'Done' | 'In Progress' | 'Blocked' | 'Not Started'
  completedAt?: string | Date | null;
  dueDate?: string | Date | null;
  createdAt?: string | Date | null;
};

export type ProjectStats = {
  cadence?: { value: number };                 // already used by FE
  throughputPerWeek?: { value: number };       // already used by FE
  activeDays?: { value: number };              // already used by FE
  onTimeCompletion?: { value: number };        // 0..1
  // NEW
  insights: {
    streakDays: number;                        // consecutive days with activity (ending today if active today)
    peakHourLocal: number | null;              // 0-23 in server local time (or UTC, depending on server TZ)
    peakDayOfWeek: number | null;              // 0 (Sun) .. 6 (Sat)
    throughputChangePct: number | null;        // -1..+1 (i.e., -0.12 == -12%)
    summary: string[];                         // human strings
  };
};

function toDate(v?: string | Date | null): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const A = startOfDay(a).getTime();
  const B = startOfDay(b).getTime();
  return Math.round((B - A) / 86400000);
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  /**
   * Fetch raw sources. Replace these with real DB calls.
   * You may already have ActivityService / TasksService—wire them in instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProjectActivities(projectId: string, sinceDays = 60): Promise<Activity[]> {
    // TODO: Replace with DB query (last N days)
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProjectTasks(projectId: string, sinceDays = 60): Promise<Task[]> {
    // TODO: Replace with DB query (last N days)
    return [];
  }

  /**
   * Main compute: returns both existing KPIs and new insights.
   */
  async computeProjectStats(projectId: string): Promise<ProjectStats> {
    const now = new Date();

    const [activities, tasks] = await Promise.all([
      this.getProjectActivities(projectId, 60),
      this.getProjectTasks(projectId, 60),
    ]);

    // --- Normalize ---
    const acts = activities
      .map(a => ({ ...a, createdAt: toDate(a.createdAt) }))
      .filter(a => a.createdAt) as Array<Activity & { createdAt: Date }>;

    const tks = tasks.map(t => ({
      ...t,
      createdAt: toDate(t.createdAt),
      completedAt: toDate(t.completedAt),
      dueDate: toDate(t.dueDate),
    }));

    // ===== Existing KPI placeholders (keep your current logic if you have it) =====
    // Cadence: rough proxy = distinct active days / window size (28d) scaled
    const windowDays = 28;
    const since = new Date(now.getTime() - windowDays * 86400000);
    const activeDaySet = new Set(
      acts
        .filter(a => a.createdAt >= since)
        .map(a => startOfDay(a.createdAt).toISOString()),
    );
    const cadenceValue = activeDaySet.size / windowDays;

    // Throughput/week: completed tasks over last 7 days
    const last7 = new Date(now.getTime() - 7 * 86400000);
    const completedLast7 = tks.filter(
      t => t.completedAt && t.completedAt >= last7,
    ).length;

    // Active days (28d)
    const activeDaysValue = activeDaySet.size;

    // On-time completion: completed before or on dueDate (consider last 30 days)
    const last30 = new Date(now.getTime() - 30 * 86400000);
    const completedLast30 = tks.filter(t => t.completedAt && t.completedAt >= last30);
    const onTimeNumer = completedLast30.filter(t => t.dueDate && t.completedAt! <= t.dueDate!).length;
    const onTimeDenom = completedLast30.length || 1;
    const onTimeValue = onTimeNumer / onTimeDenom;

    // ===== Insights =====

    // 1) Streak days (consecutive days with any activity, ending today if active today)
    const dayHasActivity = new Set(acts.map(a => startOfDay(a.createdAt).toISOString()));
    let streak = 0;
    // If today has activity, count from today backwards; if not, streak=0
    let cursor = startOfDay(now);
    if (dayHasActivity.has(cursor.toISOString())) {
      streak = 1;
      for (let i = 1; i < 200; i++) {
        const d = new Date(cursor.getTime() - i * 86400000);
        if (dayHasActivity.has(d.toISOString())) streak++;
        else break;
      }
    }

    // 2) Peak hour (local server time)
    const hourBuckets = new Array(24).fill(0);
    acts.forEach(a => {
      const h = a.createdAt.getHours(); // server local
      hourBuckets[h] += 1;
    });
    let peakHourLocal: number | null = null;
    if (hourBuckets.some(v => v > 0)) {
      peakHourLocal = hourBuckets.indexOf(Math.max(...hourBuckets));
    }

    // 3) Peak day of week (0..6)
    const dowBuckets = new Array(7).fill(0);
    acts.forEach(a => {
      dowBuckets[a.createdAt.getDay()] += 1; // 0 (Sun) .. 6 (Sat)
    });
    let peakDayOfWeek: number | null = null;
    if (dowBuckets.some(v => v > 0)) {
      peakDayOfWeek = dowBuckets.indexOf(Math.max(...dowBuckets));
    }

    // 4) Throughput change %: last 7d vs previous 7d
    const prev7Start = new Date(last7.getTime() - 7 * 86400000);
    const prev7End = last7;
    const prev7Count = tks.filter(
      t => t.completedAt && t.completedAt >= prev7Start && t.completedAt < prev7End,
    ).length;
    const curr7Count = completedLast7;
    let throughputChangePct: number | null = null;
    if (prev7Count === 0 && curr7Count === 0) throughputChangePct = 0;
    else if (prev7Count === 0 && curr7Count > 0) throughputChangePct = 1;
    else throughputChangePct = (curr7Count - prev7Count) / Math.max(1, prev7Count);

    // 5) Summaries (plain language)
    const humanDow = (d: number | null) =>
      d == null
        ? '—'
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
    const summary: string[] = [];

    summary.push(
      streak > 0
        ? `You’re on a ${streak}-day activity streak.`
        : `No activity yet today—start something small to build momentum.`,
    );

    summary.push(
      peakHourLocal == null
        ? `No peak hour yet—once activity flows in, we’ll surface your most productive time.`
        : `Most activity happens around ${peakHourLocal}:00.`,
    );

    summary.push(
      peakDayOfWeek == null
        ? `No peak day yet.`
        : `You’re most active on ${humanDow(peakDayOfWeek)}.`,
    );

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
      throughputPerWeek: { value: completedLast7 }, // simple weekly proxy
      activeDays: { value: activeDaysValue },
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
}
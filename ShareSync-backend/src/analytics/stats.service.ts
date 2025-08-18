// src/analytics/stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Shape hints; permissive for MVP
type AnyObj = Record<string, any>;

type CacheEntry<T> = { expiresAt: number; value: T };

@Injectable()
export class StatsService {
  constructor(
    @InjectModel('Project')
    private readonly projectModel: Model<AnyObj>,
  ) {}

  // --- ultra-light in-memory cache (no deps) ---
  // NOTE: per-process only; fine for a single node / dev.
  private cache = new Map<string, CacheEntry<any>>();
  private TTL_MS = Number(process.env.STATS_TTL_MS || 30_000); // default 30s

  private cacheGet<T>(key: string): T | null {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return hit.value as T;
    // (optional) could attach header w/ interceptor if you want to expose "cache-hit"
  }

  private cacheSet<T>(key: string, value: T) {
    this.cache.set(key, { value, expiresAt: Date.now() + this.TTL_MS });
  }

  private keyUser(userId: string, range: string, projectId?: string) {
    return `userStats:${userId}:${range}:${projectId || 'all'}`;
  }
  private keyProject(projectId: string, range: string) {
    return `projectStats:${projectId}:${range}`;
  }

  // ----- Public API -----

  async userStats(
    userId: string,
    range: '7' | '30' | '90' = '30',
    projectId?: string, // optional filter
  ) {
    const cacheKey = this.keyUser(userId, range, projectId);
    const cached = this.cacheGet<any>(cacheKey);
    if (cached) return cached;

    const rangeDays = this.toDays(range);
    const since = this.since(rangeDays);

    // If projectId provided, limit to that project; else all user's projects
    const query: AnyObj = projectId ? { _id: projectId } : { userId };
    const projects = await this.projectModel
      .find(query)
      .select({
        title: 1,
        status: 1,
        updatedAt: 1,
        lastActivityAt: 1,
        tasks: 1,
        updates: 1,
      })
      .lean();

    const calc = this.computeFromProjects(projects, { since, rangeDays });

    const payload = {
      cadence: { value: calc.cadence14d, windowDays: 14 },
      onTimeCompletion: { value: calc.onTime30d, windowDays: 30 },
      activeDays: { value: calc.activeDays28d, windowDays: 28 },
      throughputPerWeek: { value: calc.throughput7d, windowDays: 7 },
      activitySeries: calc.activitySeries,
      workMix: calc.workMix,
    };

    this.cacheSet(cacheKey, payload);
    return payload;
  }

  async projectStats(projectId: string, range: '7' | '30' | '90' = '30') {
    const cacheKey = this.keyProject(projectId, range);
    const cached = this.cacheGet<any>(cacheKey);
    if (cached) return cached;

    const rangeDays = this.toDays(range);
    const since = this.since(rangeDays);

    const project = await this.projectModel
      .findById(projectId)
      .select({
        title: 1,
        status: 1,
        updatedAt: 1,
        lastActivityAt: 1,
        tasks: 1,
        updates: 1,
      })
      .lean();

    const calc = this.computeFromProjects(project ? [project] : [], { since, rangeDays });
    const risks = this.computeRisks(project || undefined);

    const payload = {
      cadence: { value: calc.cadence14d, windowDays: 14 },
      onTimeCompletion: { value: calc.onTime30d, windowDays: 30 },
      activeDays: { value: calc.activeDays28d, windowDays: 28 },
      throughputPerWeek: { value: calc.throughput7d, windowDays: 7 },
      activitySeries: calc.activitySeries,
      workMix: calc.workMix,
      risks,
    };

    this.cacheSet(cacheKey, payload);
    return payload;
  }

  // ----- Calculations (naive; CPU-side) -----

  private computeFromProjects(projects: AnyObj[], opts: { since: Date; rangeDays: number }) {
    const { since } = opts;

    type Evt = {
      date: Date;
      kind: 'task' | 'update';
      status?: string;
      dueDate?: Date | null;
      completedAt?: Date | null;
      type?: string;
    };
    const events: Evt[] = [];

    for (const p of projects) {
      const tasks: AnyObj[] = Array.isArray(p?.tasks) ? p.tasks : [];
      for (const t of tasks) {
        const createdAt = this.asDate(t.createdAt);
        const completedAt = this.asDate(t.completedAt);
        const dueDate = this.asDate(t.dueDate);

        if (createdAt && createdAt >= since) {
          events.push({ date: createdAt, kind: 'task', status: t.status, dueDate, completedAt, type: t.type });
        }
        if (completedAt && completedAt >= since) {
          events.push({ date: completedAt, kind: 'task', status: 'Completed', dueDate, completedAt, type: t.type });
        }
      }

      const updates: AnyObj[] = Array.isArray(p?.updates) ? p.updates : [];
      for (const u of updates) {
        const d = this.asDate(u.createdAt || u.date || u.when);
        if (d && d >= since) events.push({ date: d, kind: 'update' });
      }
    }

    const dayKeys = this.makeDayBuckets(opts.rangeDays);
    const perDay = new Map<string, { tasks: number; updates: number }>();
    for (const k of dayKeys) perDay.set(k, { tasks: 0, updates: 0 });

    for (const e of events) {
      const key = this.dayKey(e.date);
      if (!perDay.has(key)) continue;
      const row = perDay.get(key)!;
      if (e.kind === 'task') row.tasks += 1;
      else row.updates += 1;
    }

    const activitySeries = dayKeys.map((k) => {
      const v = perDay.get(k)!;
      return { date: k, tasks: v.tasks, updates: v.updates };
    });

    const workMix = [
      { label: 'Tasks', count: activitySeries.reduce((a, d) => a + d.tasks, 0) },
      { label: 'Updates', count: activitySeries.reduce((a, d) => a + d.updates, 0) },
    ];

    // Cadence (14d, linear recency 1.0→0.5)
    const cadenceWindow = 14;
    const cadenceKeys = dayKeys.slice(-cadenceWindow);
    const w0 = 1.0, wN = 0.5;
    const step = (w0 - wN) / Math.max(1, cadenceKeys.length - 1);
    let cadenceScore = 0;
    cadenceKeys.forEach((k, i) => {
      const row = perDay.get(k)!;
      const weight = w0 - i * step;
      cadenceScore += weight * (row.tasks + row.updates);
    });

    // Throughput (7d)
    const throughput7d = dayKeys.slice(-7).reduce((a, k) => a + perDay.get(k)!.tasks, 0);

    // Active days (28d)
    const activeDays28d = dayKeys.slice(-28).reduce((a, k) => {
      const r = perDay.get(k)!;
      return a + (r.tasks + r.updates > 0 ? 1 : 0);
    }, 0);

    // On-time completion (30d)
    const thirtySince = this.since(30);
    let completed = 0;
    let ontime = 0;
    for (const p of projects) {
      const tasks: AnyObj[] = Array.isArray(p?.tasks) ? p.tasks : [];
      for (const t of tasks) {
        const completedAt = this.asDate(t.completedAt);
        if (!completedAt || completedAt < thirtySince) continue;
        completed += 1;
        const dueDate = this.asDate(t.dueDate);
        if (dueDate && completedAt.getTime() <= dueDate.getTime()) ontime += 1;
      }
    }
    const onTime30d = completed > 0 ? ontime / completed : 0;

    return {
      cadence14d: round2(cadenceScore),
      throughput7d,
      activeDays28d,
      onTime30d: round4(onTime30d),
      activitySeries,
      workMix,
    };

    function round2(n: number) { return Math.round(n * 100) / 100; }
    function round4(n: number) { return Math.round(n * 10000) / 10000; }
  }

  private computeRisks(p?: AnyObj) {
    if (!p) return { overdue: 0, noOwner: 0, stale7d: false };
    const tasks: AnyObj[] = Array.isArray(p.tasks) ? p.tasks : [];
    const now = Date.now();

    const overdue = tasks.filter((t) => {
      const due = this.asDate(t.dueDate);
      const done = String(t.status || '').toLowerCase() === 'completed';
      return due && due.getTime() < now && !done;
    }).length;

    const noOwner = tasks.filter((t) => !t.ownerId && !t.assigneeId).length;

    const last = this.asDate(p.lastActivityAt || p.updatedAt);
    const stale7d = last ? (now - last.getTime()) > 7 * 24 * 3600 * 1000 : true;

    return { overdue, noOwner, stale7d };
  }

  // ----- tiny utils -----

  private toDays(range: '7' | '30' | '90') { return range === '7' ? 7 : range === '90' ? 90 : 30; }
  private since(days: number) { return new Date(Date.now() - days * 24 * 3600 * 1000); }
  private asDate(v: any): Date | null { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  private dayKey(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  private makeDayBuckets(days: number) {
    const arr: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      arr.push(this.dayKey(d));
    }
    return arr;
  }
}

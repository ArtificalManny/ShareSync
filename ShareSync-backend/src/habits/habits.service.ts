import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivitiesService } from '../activities/activities.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type AnyObj = Record<string, any>;

export interface HabitsPrefs {
  userId: string;
  workdays?: number[];        // 0-6 (Sun..Sat)
  quietHours?: { start?: string; end?: string }; // "HH:mm"
  nudges?: { sprint?: boolean; update?: boolean; convertTask?: boolean };
  weeklyReminder?: { day?: number; time?: string }; // day: 0-6; time: "HH:mm"
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Reflection {
  userId: string;
  weekOf: string; // YYYY-WW
  wins?: string[];
  focus?: string;
  createdAt?: Date;
}

export interface NudgeDismissal {
  userId: string;
  nudgeId: string;
  dismissedAt: Date;
}

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private readonly activities: ActivitiesService,
    private readonly rt: RealtimeGateway,
    @InjectModel('HabitsPrefs') private readonly prefsModel?: Model<HabitsPrefs>,
    @InjectModel('Reflection') private readonly reflectionModel?: Model<Reflection>,
    @InjectModel('NudgeDismissal') private readonly nudgeModel?: Model<NudgeDismissal>,
  ) {}

  // ---------- Cadence ----------

  async computeCadence({
    userId,
    projectId,
    range = 14,
  }: {
    userId: string;
    projectId?: string;
    range?: number;
  }) {
    const prefs = await this.getPrefs(userId);
    const workdays = Array.isArray(prefs?.workdays) && prefs.workdays.length
      ? prefs.workdays
      : [1,2,3,4,5]; // Mon-Fri default

    // pull “meaningful” activity within range days
    const since = new Date();
    since.setDate(since.getDate() - (range - 1));
    const { items } = await this.activities.list({
      scope: projectId ? 'project' : 'user',
      projectId,
      userId,
      range: 'all',
      limit: 300,
    });

    const dayKey = (d: Date) => new Date(d).toISOString().slice(0,10);
    const meaningful = (ev: AnyObj) => {
      const t = String(ev?.type || ev?.kind || '').toLowerCase();
      return (
        t.startsWith('update') ||
        t === 'task.created' || t === 'task.completed' ||
        t.startsWith('file')
      );
    };
    const activeSet = new Set<string>();
    for (const ev of items || []) {
      try {
        if (!meaningful(ev)) continue;
        const ts = new Date(ev?.createdAt ?? Date.now());
        if (ts < since) continue;
        const dk = dayKey(ts);
        const dow = new Date(dk).getDay();
        if (workdays.includes(dow)) activeSet.add(dk);
      } catch {}
    }

    const activeDays = activeSet.size;
    const score = Math.max(0, Math.min(1, activeDays / range));

    return {
      range,
      activeDays,
      totalDays: range,
      score,
      workdays,
      label: `${activeDays} active workdays in last ${range}d`,
    };
  }

  // ---------- Sprint Momentum ----------
  // No hard dependency on SprintsService. We infer “completions” from activity types:
  // e.g., 'sprint.completed', 'focus.completed', or any event whose type includes both
  // 'sprint' and 'complete' (case-insensitive).
  async getSprintMomentum({
    userId,
    projectId,
    range = 28,
  }: { userId: string; projectId?: string; range?: number }) {
    const since = new Date();
    since.setDate(since.getDate() - (range - 1));

    const { items } = await this.activities.list({
      scope: projectId ? 'project' : 'user',
      projectId,
      userId,
      range: 'all',   // we filter by date below
      limit: 1000,    // generous upper bound; we filter/aggregate in memory
    });

    const byDay = new Map<string, number>();
    const isCompletion = (t: string) => {
      const s = t.toLowerCase();
      return (
        s === 'sprint.completed' ||
        s === 'focus.completed' ||
        (s.includes('sprint') && (s.includes('complete') || s.includes('finish')))
      );
    };

    for (const ev of items || []) {
      const t = String(ev?.type || ev?.kind || '');
      if (!isCompletion(t)) continue;
      const ts = new Date(ev?.createdAt ?? Date.now());
      if (ts < since) continue;
      const d = this.dayKey(ts);
      byDay.set(d, (byDay.get(d) || 0) + 1);
    }

    // build contiguous bars for the requested range (oldest → newest)
    const bars: Array<{ date: string; count: number }> = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this.dayKey(d);
      bars.push({ date: key, count: byDay.get(key) || 0 });
    }

    const total = bars.reduce((acc, b) => acc + b.count, 0);
    return { range, total, bars };
  }

  // ---------- Prefs ----------

  async getPrefs(userId: string): Promise<HabitsPrefs> {
    if (!this.prefsModel) {
      return {
        userId,
        workdays: [1,2,3,4,5],
        quietHours: { start: '22:00', end: '07:00' },
        nudges: { sprint: true, update: true, convertTask: true },
      };
    }
    let doc = await this.prefsModel.findOne({ userId }).lean().exec();
    if (!doc) {
      doc = await this.prefsModel.create({
        userId,
        workdays: [1,2,3,4,5],
        quietHours: { start: '22:00', end: '07:00' },
        nudges: { sprint: true, update: true, convertTask: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      // @ts-ignore
      if (typeof (doc as any).toObject === 'function') doc = (doc as any).toObject();
    }
    return doc as HabitsPrefs;
  }

  async updatePrefs(userId: string, patch: Partial<HabitsPrefs>) {
    if (!this.prefsModel) return { ok: true, userId, ...patch };
    const now = new Date();
    const doc = await this.prefsModel.findOneAndUpdate(
      { userId },
      { $set: { ...(patch || {}), updatedAt: now } },
      { new: true, upsert: true },
    ).lean().exec();
    return doc;
  }

  // ---------- Reflections ----------

  async postReflection(userId: string, payload: { wins?: string[]; focus?: string }) {
    const weekOf = this.weekKey(new Date());
    if (!this.reflectionModel) return { userId, weekOf, ...payload, createdAt: new Date() };
    const doc = await this.reflectionModel.findOneAndUpdate(
      { userId, weekOf },
      { $set: { wins: payload?.wins || [], focus: payload?.focus || '', createdAt: new Date() } },
      { upsert: true, new: true },
    ).lean().exec();
    // live update for dashboards
    try { this.rt.emitToUser(userId, 'habits:updated', { kind: 'reflection' }); } catch {}
    return doc;
  }

  async getLatestReflection(userId: string) {
    if (!this.reflectionModel) return null;
    const doc = await this.reflectionModel.findOne({ userId }).sort({ createdAt: -1 }).lean().exec();
    return doc || null;
  }

  // ---------- Nudges ----------

  async dismissNudge(userId: string, nudgeId: string) {
    if (!nudgeId) return { ok: false };
    if (!this.nudgeModel) return { ok: true };
    await this.nudgeModel.create({ userId, nudgeId, dismissedAt: new Date() });
    return { ok: true };
  }

  // ---------- utils ----------

  private weekKey(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7; // 1-7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
    const y = date.getUTCFullYear();
    return `${y}-${String(weekNo).padStart(2,'0')}`;
  }

  private dayKey(d: Date) {
    // YYYY-MM-DD in local time (aligns with UI charts that use local dates)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
}
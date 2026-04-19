// /backend/src/analytics/kpis.ts
// Lightweight analytics utilities for Project KPIs.
// Safe on sparse data. No external deps.

type AnyProject = {
    tasks?: Array<{
      _id?: any;
      title?: string;
      status?: string;         // 'Not Started' | 'In Progress' | 'Completed'
      assigneeId?: string | null;
      dueDate?: string | Date | null;
      createdAt?: string | Date | null;
      completedAt?: string | Date | null; // we'll start populating this in patchTask
    }>;
    updates?: Array<{
      _id?: any;
      userId?: string | null;
      text?: string;
      createdAt?: string | Date | null;
    }>;
  };
  
  const toDate = (d: any): Date | null => {
    try {
      if (!d) return null;
      const dt = d instanceof Date ? d : new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    } catch {
      return null;
    }
  };
  
  const daysAgo = (n: number): Date => {
    const dt = new Date();
    dt.setDate(dt.getDate() - n);
    return dt;
  };
  
  const isOnOrAfter = (a: Date | null, b: Date | null) =>
    !!(a && b && a.getTime() >= b.getTime());
  
  const isBeforeOrEqual = (a: Date | null, b: Date | null) =>
    !!(a && b && a.getTime() <= b.getTime());
  
  const withinDays = (d: Date | null, n: number) =>
    !!(d && d.getTime() >= daysAgo(n).getTime());
  
  const ymd = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  
  const median = (nums: number[]): number => {
    if (!nums.length) return 0;
    const a = [...nums].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  };
  
  /** % tasks completed ON or BEFORE due date, considering only completions in last 30d. */
  export function onTimePct30d(project: AnyProject): number {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    const completedLast30d = tasks.filter((t) => {
      const doneAt = toDate(t.completedAt);
      return t.status === 'Completed' && withinDays(doneAt, 30);
    });
  
    const withDue = completedLast30d.filter((t) => toDate(t.dueDate));
    if (!withDue.length) return 0;
  
    const onTime = withDue.filter((t) => {
      const doneAt = toDate(t.completedAt);
      const due = toDate(t.dueDate);
      if (doneAt && due) return isBeforeOrEqual(doneAt, due);
      // Fallback inference (legacy data without completedAt):
      // If no completedAt but was completed AND createdAt ≤ dueDate, count as on-time (best-effort).
      const created = toDate(t.createdAt);
      return created && due ? isBeforeOrEqual(created, due) : false;
    });
  
    return Math.round((onTime.length / withDue.length) * 100);
  }
  
  /** Cadence score over last 14d: unique active days vs target. 
   * weekendCount=true means weekends count, so target is 14. 
   * weekendCount=false means weekdays only, target is 10. */
  export function cadence14d(project: AnyProject, weekendCount = false): number {
    const updates = Array.isArray(project?.updates) ? project.updates : [];
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  
    const since = daysAgo(14).getTime();
    const days = new Set<string>();
  
    updates.forEach((u) => {
      const dt = toDate(u.createdAt);
      if (dt && dt.getTime() >= since) days.add(ymd(dt));
    });
  
    tasks.forEach((t) => {
      const c = toDate(t.createdAt);
      if (c && c.getTime() >= since) days.add(ymd(c));
      const done = toDate((t as any).completedAt);
      if (done && done.getTime() >= since) days.add(ymd(done));
    });
  
    const active = days.size;           // 0..14
    const target = weekendCount ? 14 : 10; // 14 if weekends count, 10 if weekday-only
    const score = Math.min(1, active / target) * 100;
    return Math.round(score);
  }
  
  /** Median hours between consecutive updates in last 30d (proxy for responsiveness). */
  export function responsivenessHoursMedian(project: AnyProject): number {
    const updates = (Array.isArray(project?.updates) ? project.updates : [])
      .map((u) => toDate(u.createdAt))
      .filter((d): d is Date => !!d && withinDays(d, 30))
      .sort((a, b) => a.getTime() - b.getTime());
  
    if (updates.length < 2) return 0;
  
    const deltasHrs: number[] = [];
    for (let i = 1; i < updates.length; i++) {
      const prev = updates[i - 1]!;
      const cur = updates[i]!;
      const diffMs = cur.getTime() - prev.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      deltasHrs.push(hours);
    }
  
    return Math.round(median(deltasHrs));
  }
  
  /** Update contribution mix over last 30d. Returns top contributors and total updates. */
  export function contributionMix30d(project: AnyProject): {
    top: Array<{ userId: string; count: number; pct: number }>;
    totalUpdates30d: number;
  } {
    const updates = Array.isArray(project?.updates) ? project.updates : [];
    const recent = updates.filter((u) => withinDays(toDate(u.createdAt), 30));
    const totals = new Map<string, number>();
  
    for (const u of recent) {
      const id = (u.userId || 'unknown') as string;
      totals.set(id, (totals.get(id) || 0) + 1);
    }
  
    const total = recent.length || 1;
    const top = [...totals.entries()]
      .map(([userId, count]) => ({
        userId,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  
    return { top, totalUpdates30d: recent.length };
  }
  
  /** Velocity = tasks Completed in last 7d (falls back to Created if no completedAt). */
  export function velocityTasksPer7d(project: AnyProject): number {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    const completed = tasks.filter((t) => {
      if (t.status === 'Completed') {
        const done = toDate(t.completedAt) || toDate(t.createdAt);
        return withinDays(done, 7);
      }
      return false;
    });
    return completed.length;
  }
  
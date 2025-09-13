/**
 * computeActiveDays(events, { range=14, workdays=[1,2,3,4,5] })
 * events: [{ createdAt, type }]
 * Returns { activeDays, totalDays, activeSet } where activeSet is Set('YYYY-MM-DD')
 */
export function computeActiveDays(events = [], { range = 14, workdays = [1,2,3,4,5] } = {}) {
    const dayKey = (d) => new Date(d).toISOString().slice(0,10);
    const since = new Date(); since.setDate(since.getDate() - (range - 1));
    const isWorkday = (iso) => workdays.includes(new Date(iso).getDay());
  
    const active = new Set();
    for (const e of events) {
      const iso = dayKey(e?.createdAt || e?.timestamp || Date.now());
      const t = new Date(iso);
      if (t >= since && isWorkday(iso)) active.add(iso);
    }
    return { activeDays: active.size, totalDays: range, activeSet: active };
  }
  
  /**
   * cadenceScore: 0..1 scale
   * weights activity on workdays only (optional)
   */
  export function cadenceScore({ activeDays, totalDays }, { min = 0, max = 1 } = {}) {
    if (!totalDays) return 0;
    const raw = Math.max(0, Math.min(1, activeDays / totalDays));
    return Math.max(min, Math.min(max, raw));
  }
  
  /**
   * fmtActiveDaysLabel: “X active workdays in last 14d”
   */
  export function fmtActiveDaysLabel(activeDays, range = 14) {
    return `${activeDays} active workdays in last ${range}d`;
  }
  
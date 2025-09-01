// /src/utils/cadenceAnalytics.js

/**
 * Cadence Analytics (frontend-only)
 * - Persist sessions to localStorage
 * - Compute insights:
 *    • completionRate
 *    • successRateByDuration (15/25/50/custom buckets)
 *    • typicalDropOffMin (median minutes when interrupted)
 *    • preferredStartHour (mode hour-of-day, 0–23)
 *    • avgFocusMinutes
 *    • streakless, serious summaries (no gamification)
 * - Optional: POST a session to backend (safe no-op if endpoint missing)
 */

/** @typedef {{
 *   id: string,
 *   intent: string,
 *   durationMin: number,
 *   startedAt: number,   // epoch ms
 *   endedAt: number,     // epoch ms
 *   interrupted: boolean // true if paused/reset before completion
 * }} CadenceSession
 */

    const STORAGE_KEY = "sharesync.cadence.sessions.v1";

    // ---------- storage ----------
    
    export function getSessions() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    export function saveSessions(sessions) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch {
        /* ignore quota/privacy */
      }
    }
    
    export function clearSessions() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    
    // ---------- recording ----------
    
    const genId = () =>
      `s_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
    
    /**
     * Add a completed/aborted session.
     * If fields are missing, they’ll be sanitized.
     * @param {Partial<CadenceSession>} s
     * @param {{post?: boolean}} [opts]  set {post:true} to call postSession()
     * @returns {CadenceSession}
     */
    export function addSession(s, opts = {}) {
      const durationMin =
        typeof s.durationMin === "number" && s.durationMin > 0
          ? Math.round(s.durationMin)
          : 25;
      const startedAt =
        typeof s.startedAt === "number" ? s.startedAt : Date.now();
      const endedAt =
        typeof s.endedAt === "number" && s.endedAt >= startedAt
          ? s.endedAt
          : startedAt;
      const session = {
        id: s.id || genId(),
        intent: (s.intent || "").trim(),
        durationMin,
        startedAt,
        endedAt,
        interrupted: Boolean(s.interrupted),
      };
    
      const all = [session, ...getSessions()];
      saveSessions(all);
    
      if (opts.post) {
        // Fire and forget; safe if endpoint doesn’t exist.
        postSession(session).catch(() => {});
      }
    
      return session;
    }
    
    // ---------- insights ----------
    
    function bucketForDuration(min) {
      if (min <= 15) return "15";
      if (min <= 25) return "25";
      if (min <= 35) return "35";
      if (min <= 50) return "50";
      return "custom";
    }
    
    function percentile(arr, p) {
      if (!arr.length) return null;
      const a = [...arr].sort((x, y) => x - y);
      const idx = Math.min(a.length - 1, Math.max(0, Math.floor((p / 100) * a.length)));
      return a[idx];
    }
    
    function mode(arr) {
      if (!arr.length) return null;
      const counts = new Map();
      let best = arr[0],
        bestC = 0;
      for (const v of arr) {
        const c = (counts.get(v) || 0) + 1;
        counts.set(v, c);
        if (c > bestC) {
          best = v;
          bestC = c;
        }
      }
      return best;
    }
    
    /**
     * Compute core insights from sessions.
     * @param {CadenceSession[]} [sessions]
     */
    export function computeInsights(sessions = getSessions()) {
      if (!sessions.length) {
        return {
          total: 0,
          completionRate: 0,
          successRateByDuration: {},
          typicalDropOffMin: null,
          preferredStartHour: null,
          avgFocusMinutes: 0,
          recentIntent: null,
        };
      }
    
      const total = sessions.length;
      const completed = sessions.filter((s) => !s.interrupted);
      const completionRate = completed.length / total;
    
      // success rate by requested duration bucket
      const groups = sessions.reduce((acc, s) => {
        const k = bucketForDuration(s.durationMin);
        acc[k] = acc[k] || { total: 0, success: 0 };
        acc[k].total += 1;
        if (!s.interrupted) acc[k].success += 1;
        return acc;
      }, /** @type {Record<string,{total:number,success:number}>} */ ({}));
    
      const successRateByDuration = Object.fromEntries(
        Object.entries(groups).map(([k, v]) => [k, v.success / v.total])
      );
    
      // typical drop-off (median minutes elapsed when interrupted)
      const dropMins = sessions
        .filter((s) => s.interrupted)
        .map((s) => Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000)));
      const typicalDropOffMin = dropMins.length ? percentile(dropMins, 50) : null;
    
      // preferred start hour (mode 0-23)
      const hours = sessions.map((s) => new Date(s.startedAt).getHours());
      const preferredStartHour = mode(hours);
    
      // average actual focus minutes (all sessions)
      const focusMins = sessions.map((s) =>
        Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000))
      );
      const avgFocusMinutes =
        focusMins.reduce((a, b) => a + b, 0) / Math.max(1, focusMins.length);
    
      const recentIntent = sessions[0]?.intent || null;
    
      return {
        total,
        completionRate,
        successRateByDuration,
        typicalDropOffMin,
        preferredStartHour,
        avgFocusMinutes,
        recentIntent,
      };
    }
    
    /**
     * Convenience accessor for UI components.
     */
    export function getInsights() {
      return computeInsights(getSessions());
    }
    
    // ---------- optional backend sync ----------
    
    /**
     * POST a session to backend analytics (optional).
     * Update the endpoint to match your API when ready.
     * Non-throwing: failures are ignored by default.
     * @param {CadenceSession} session
     */
    export async function postSession(session) {
      // Example endpoint; adjust or remove.
      const url = "/api/cadence/sessions";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`POST ${url} ${res.status}`);
        return await res.json();
      } catch (err) {
        // Swallow errors to keep UI smooth; log in dev.
        if (import.meta?.env?.MODE !== "production") {
          console.warn("[cadenceAnalytics] postSession failed:", err);
        }
        throw err;
      }
    }
    
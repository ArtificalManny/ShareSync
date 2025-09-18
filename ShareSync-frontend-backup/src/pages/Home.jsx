// /src/pages/Home.jsx
import React, { useState, useEffect, useContext, Suspense, useRef, useMemo } from 'react';
import client from '../api/client';
import { getProjectsQuick } from '../api/projects';
import { AuthContext } from '../AuthContext';
import { mark, measure } from '../utils/perfLog';
import { track } from '../utils/telemetry';

import HomeHeader from '../components/home/HomeHeader.jsx';
import ProjectsRail from '../components/home/ProjectsRail.jsx';
import KpiRow from '../components/analytics/KpiRow.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import AuditList from '../components/audit/AuditList.jsx';
import InviteModal from '../components/invite/InviteModal';
import FocusSprint from '../components/home/FocusSprint.jsx';
import CadenceMeter from '../components/habits/CadenceMeter.jsx';
import SprintMomentum from '../components/habits/SprintMomentum.jsx';

import {
  KPI_STRIP_ENABLED,
  SMART_SEARCH_ENABLED,
  FEED_ENABLED,
  AI_COACH_ENABLED,
  TENX_ENABLED,
  LEADERBOARD_ENABLED,
  TRANSPARENCY_ENABLED,
  HABITS_ENABLED,
} from '../config/flags';

import './Home.css';

const ActivityOverTimeLive = React.lazy(() => import('../components/analytics/ActivityOverTimeLive.jsx'));

const DEFAULT_PROFILE_PIC = '/default-profile.png';

/* ================= Feature flags (wired to central flags) ================= */
const SHOW_KPI_STRIP    = KPI_STRIP_ENABLED;     // Bezos
const SHOW_SMART_SEARCH = SMART_SEARCH_ENABLED;  // Page
const SHOW_FEED         = FEED_ENABLED;          // Zuck
const SHOW_AI_COACH     = AI_COACH_ENABLED;      // Thiel
const SHOW_TENX         = TENX_ENABLED;          // Musk
const SHOW_LEADERBOARD  = LEADERBOARD_ENABLED;   // Thiel + Zuck transparency
/* ========================================================================= */

/* ---------------- helpers / inline components ---------------- */

// Scoped style tweaks (tone down KPI glow, focus ring, row min-heights, top progress)
const PageStyles = () => (
  <style>{`
    /* ~10% tighter vertical rhythm */
    .home-page { row-gap: 1.5rem; } /* tailwind space-y-6-ish */
    @media (min-width: 768px) { .home-page { row-gap: 1.75rem; } } /* was 2rem */

    /* Soften aura specifically for KPI row cards */
    .kpi-strip .card::before { opacity: .28 !important; filter: blur(20px) !important; }
    /* One accent per row: ensure containers carry only row-accent background, not inner gradients */
    .row-accent > .card.card--no-inner::before { display:none; }

    /* Visible keyboard focus */
    .focus-ring:focus-visible { outline: 2px solid var(--accent, #6366f1); outline-offset: 2px; border-radius: 14px; }

    /* Normalize card heights per row */
    .row-grid { align-items: stretch; }
    .row-grid > * { min-height: 112px; }           /* KPI/search row */
    .row-grid.feed > * { min-height: 188px; }
    .row-grid.habits > * { min-height: 146px; }

    /* Top progress bar (indeterminate → linear after 2s) */
    .top-progress { position: sticky; top: 0; left: 0; right: 0; height: 3px; z-index: 70; background: transparent; }
    .top-progress .indet { display:block; height:100%; width:35%; background: linear-gradient(90deg,#6366f1,#ec4899);
      animation: tp 1.2s ease-in-out infinite; border-radius: 999px; opacity:.85; }
    @keyframes tp { 0% {margin-left:0%} 50%{margin-left:65%} 100%{margin-left:0%} }
    .top-progress .linear { height:100%; background: linear-gradient(90deg,#6366f1,#ec4899); border-radius:999px; }

    /* Right drawer overlay + panel */
    .drawer { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.34); display:grid; grid-template-columns: 1fr auto; }
    .drawer__panel { width:min(420px,90vw); background: var(--surface,#fff); border-left: 1px solid var(--border,#e5e7eb);
      box-shadow: -12px 0 32px rgba(2,6,23,.10); }
  `}</style>
);

// Presence avatars (Zuck)
function PresenceBar({ people = [] }) {
  if (!people.length) people = [
    { id: 'm', name: 'Manny' },
    { id: 'a', name: 'Alex' },
    { id: 'j', name: 'Jordan' },
  ];
  return (
    <div className="avatar-stack">
      {people.map((p, i) => (
        <div key={p.id || i} className="avatar w-7 h-7 text-[10px]">{(p.name || 'U')[0]}</div>
      ))}
      <span className="ml-2 text-xs text-muted">{people.length} online</span>
    </div>
  );
}

// tiny chip
function Chip({ tone = 'neutral', children, className = '', onClick }) {
  const toneCls =
    tone === 'good' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
    tone === 'bad'  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300';
  const Cmp = onClick ? 'button' : 'span';
  return <Cmp onClick={onClick} className={`px-1.5 py-0.5 rounded text-[10px] ${toneCls} ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}>{children}</Cmp>;
}

// safe percent delta helper
const pct = (a, b) => {
  const A = Number(a ?? 0), B = Number(b ?? 0);
  if (B === 0) return A === 0 ? 0 : 100; // from 0 to >0 => +100%
  return Math.round(((A - B) / Math.max(1, Math.abs(B))) * 100);
};

// Small inline sparkline (expects an array of numbers)
function Sparkline({ data, w = 96, h = 18, title }) {
  const arr = Array.isArray(data) && data.length ? data : Array(7).fill(1);
  const max = Math.max(...arr, 1);
  const min = Math.min(...arr, 0);
  const last = arr[arr.length - 1] ?? 0;
  const pad = 2;
  const xStep = (w - pad * 2) / (arr.length - 1 || 1);
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const path = arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + xStep * i} ${y(v)}`).join(' ');
  const tt = title ?? `7d · min ${min} · max ${max} · last ${last}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block mt-2" role="img" aria-label={tt} title={tt}>
      <path d={path} fill="none" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.6" />
    </svg>
  );
}

// KPI strip + velocity hint (Bezos)
function KpiStrip({ stats }) {
  const today = stats?.today || {};
  const cmp = stats?.compare?.today || {};
  const ts = stats?.timeseries || {};
  const why = stats?.attribution || {};

  const tiles = [
    { key: 'tasksDone',  label: 'Tasks done', value: today.tasksDone ?? '—', prev: cmp.tasksDone },
    { key: 'focusMins',  label: 'Focus mins', value: today.focusMins ?? '—', prev: cmp.focusMins },
    { key: 'streak',     label: 'Streak',     value: (stats?.streak ?? 0) + 'd', prev: (stats?.compare?.streak ?? 0) },
    { key: 'onTime',     label: 'On-time %',  value: stats?.onTimeCompletion?.pct ?? '—', prev: stats?.compare?.onTimePct },
  ];

  const tputs = stats?.throughputPerWeek || {};
  const velocity =
    (Number(tputs.prev ?? 0) === 0)
      ? (Number(tputs.value ?? 0) > 0 ? 1 : 0)
      : Number(tputs.value ?? 0) / Number(tputs.prev ?? 1);
  const velocityText = Number.isFinite(velocity) ? `${velocity.toFixed(1)}× ${velocity >= 1 ? 'faster' : 'slower'}` : '—';

  const goKPIs = () => document.getElementById('kpis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="kpi-strip grid grid-cols-2 sm:grid-cols-4 gap-3 row-grid">
      {tiles.map((t) => {
        const delta = pct(t.value, t.prev);
        const tone  = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral';
        const seriesObj = ts?.[t.key];
        const series = seriesObj?.last7 || seriesObj || [];
        const min = Array.isArray(series) && series.length ? Math.min(...series) : 0;
        const max = Array.isArray(series) && series.length ? Math.max(...series) : 0;
        const last = Array.isArray(series) && series.length ? series[series.length - 1] : 0;
        const whyLine = why?.[t.key]?.top?.label
          ? `${why?.[t.key]?.top?.delta > 0 ? '+' : ''}${why?.[t.key]?.top?.delta ?? ''} from ${why?.[t.key]?.top?.label}`
          : null;

        return (
          <div
            key={t.key}
            role="button"
            tabIndex={0}
            onClick={goKPIs}
            onKeyDown={(e) => e.key === 'Enter' && goKPIs()}
            className="card rounded-2xl p-3 shine accent-bar relative hover:cursor-pointer hover-raise focus-ring"
            aria-label={`Open KPIs filtered by ${t.label}`}
            title={`7d ${t.label} · min ${min} · max ${max} · last ${last}`}
          >
            <span className="accent-bar__left" aria-hidden="true" />
            <div className="text-2xl font-bold">{t.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-muted">{t.label}</div>
              <Chip tone={tone} onClick={goKPIs}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</Chip>
            </div>
            <Sparkline data={series} />
            {whyLine && <div className="text-[10px] text-muted mt-1">{whyLine}</div>}
          </div>
        );
      })}

      {/* Velocity + goal hint */}
      <div
        role="button"
        tabIndex={0}
        onClick={goKPIs}
        onKeyDown={(e) => e.key === 'Enter' && goKPIs()}
        className="card rounded-2xl p-3 shine accent-bar relative sm:col-span-2 hover:cursor-pointer hover-raise focus-ring"
        title="See detailed throughput and goals"
      >
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Velocity</div>
            <div className="text-lg font-semibold">{velocityText}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Goal</div>
            <div className="text-sm">
              {(stats?.goal?.label ?? '2 sprints/day')}
              <span className="text-muted"> · benchmark: top 10% do 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart search (Page) — keyboard shortcuts + hints + answer capsule + aria-live
function SmartSearch({ onAsk }) {
  const [q, setQ] = useState('');
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // global "/", Cmd/Ctrl-K to focus; "Esc" clears & blurs
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const inText = tag === 'input' || tag === 'textarea';
      const cmdK = (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey));
      if ((e.key === '/' || cmdK) && !inText) { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === 'Escape' && (inText && document.activeElement === inputRef.current)) {
        setQ(''); setAnswers([]); inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hints = ['what did i complete last week', 'overdue this week', 'streak this month'];

  const run = (query) => {
    if (!query?.trim()) return;
    const lower = query.toLowerCase();
    const out = [];
    if (lower.includes('finish') || lower.includes('complete')) out.push('Completed 5 tasks last week');
    if (lower.includes('overdue') || lower.includes('late')) out.push('1 task overdue this week');
    if (lower.includes('streak')) out.push('Streak is 0 days — start a sprint today');
    if (!out.length) out.push('Try: “overdue this week” • “streak this month” • “top project”');
    setAnswers(out);
    onAsk(query);
    if (resultsRef.current) resultsRef.current.textContent = out.join(' · ');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((i) => (i + 1) % hints.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((i) => (i - 1 + hints.length) % hints.length); }
    else if (e.key === 'Enter' && selected >= 0) { const h = hints[selected]; setQ(h); run(h); }
    else if (e.key === 'Enter') { run(q); }
  };

  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring min-h-[112px]">
      <span className="accent-bar__left" aria-hidden="true" />
      <div ref={resultsRef} aria-live="polite" className="sr-only" />

      {/* answer capsule (kept after run) */}
      {answers.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md border border-border bg-surface">
            {answers[0]} · <a href="#recent-activity" className="underline">open report</a>
          </span>
          {answers.slice(1).map((a,i) => <span key={i} className="px-2 py-1 rounded-md border border-border bg-surface text-xs">{a}</span>)}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id="smartSearch"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          placeholder='Ask anything… (Press “/” or Cmd/Ctrl-K)'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn btn--primary marching" onClick={() => run(q)}>Ask AI</button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {hints.map((h, i) => (
          <button
            key={h}
            className={`btn btn--ghost text-xs ${selected === i ? 'ring-2 ring-accent' : ''}`}
            onMouseEnter={() => setSelected(i)}
            onFocus={() => setSelected(i)}
            onClick={() => { setQ(h); run(h); }}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

// Micro activity feed (Zuck) — badges + right-side drawer details with focus trap
const MOCK_FEED = [
  { id: '1', type: 'task',  who: 'Manny',  action: 'completed 3 tasks', when: '2m ago', project: 'Launch Alpha' },
  { id: '2', type: 'sprint',who: 'Alex',   action: 'started a sprint',  when: '10m ago', project: 'Growth' },
  { id: '3', type: 'due',   who: 'Jordan', action: 'added a due date',  when: '27m ago', project: 'Docs' },
];
function MicroFeed({ items = MOCK_FEED, onOpen }) {
  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">What’s happening</div>
        <PresenceBar />
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(i)}
            onKeyDown={(e) => e.key === 'Enter' && onOpen?.(i)}
            className="flex items-center justify-between text-sm hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded px-2 py-1 focus-ring"
            title="Open details"
          >
            <div className="truncate flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 uppercase tracking-wide">{i.type}</span>
              <span className="font-medium">{i.who}</span>
              <span className="text-muted">{i.action}</span>
            </div>
            <span className="text-xs text-muted">{i.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// AI Coach (Thiel)
function AiCoachCard({ nextBest }) {
  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="text-sm font-semibold">AI Sprint Coach</div>
      <p className="text-sm text-muted mt-1">
        Suggested plan: {nextBest || 'Start a 25-min sprint on the top impact task, then a 5-min review.'}
      </p>
      <div className="mt-2 flex gap-2">
        <button className="btn btn--primary">Start plan</button>
        <button className="btn btn--outline">Regenerate</button>
      </div>
    </div>
  );
}

// Leaderboard (Thiel + Zuck)
const MOCK_BOARD = [
  { id: 'm', name: 'Manny',   streak: 3 },
  { id: 'a', name: 'Alex',    streak: 2 },
  { id: 'j', name: 'Jordan',  streak: 1 },
];
function Leaderboard({ items = MOCK_BOARD }) {
  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="text-sm font-semibold mb-2">Streak Leaderboard</div>
      <ol className="space-y-1">
        {items.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted w-5">{i + 1}.</span>
              <div className="avatar w-6 h-6 text-[10px]">{p.name[0]}</div>
              <span className="font-medium">{p.name}</span>
            </div>
            <span className="text-xs text-muted">{p.streak}d</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// 10× overlay (Musk)
function TenXOverlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 grid place-items-center">
      <div className="card rounded-2xl p-5 w-[min(720px,95vw)] relative">
        <button className="btn btn--ghost absolute top-2 right-2" onClick={onClose}>Close</button>
        <div className="text-lg font-bold mb-2">10× Mode</div>
        <p className="text-sm text-muted mb-3">
          30-minute hyper-focus block: queue a task, start a timer, mute distractions, and show progress pulses.
        </p>
        <div className="flex gap-2">
          <button className="btn btn--primary marching" onClick={onClose}>Launch sequence</button>
          <button className="btn btn--outline" onClick={onClose}>Not now</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Page ------------------------------ */

export default function Home() {
  // First-render perf mark
  mark('ss:home:render:start');

  const { user: authUser } = useContext(AuthContext) || {};
  const [user, setUser] = useState(null);

  // Projects rail
  const [quickProjects, setQuickProjects] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);

  // Live KPI controls/state
  const [projects, setProjects] = useState([]);
  const [statsRange, setStatsRange] = useState(30);             // 7 | 30 | 90
  const [statsProjectId, setStatsProjectId] = useState('all');  // 'all' or project _id
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  // UI
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tenxOpen, setTenxOpen] = useState(false);
  const [publicMode, setPublicMode] = useState(false); // transparency toggle
  const [celebrate, setCelebrate] = useState(false);   // sprint celebration
  const [sprintActive, setSprintActive] = useState(false); // thin top progress
  const [sprintStart, setSprintStart] = useState(null);     // for linear progress

  // Feed drawer
  const [drawerItem, setDrawerItem] = useState(null);
  const drawerFirstBtnRef = useRef(null);

  // Measure first render (commit)
  useEffect(() => {
    measure('perf:home:first-render', 'ss:home:render:start');
  }, []);

  // ---- Initial minimal loads ----
  useEffect(() => {
    mark('ss:home:bootstrap:start');
    Promise.all([
      client.get('/users/me').catch(() => client.get('/user/me')),
      client.get('/projects').catch(() => ({ data: [] })),
    ])
      .then(([userRes, projRes]) => {
        setUser(userRes.data);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
      })
      .catch(() => {})
      .finally(() => {
        measure('perf:home:bootstrap', 'ss:home:bootstrap:start');
      });
  }, []);

  // quick rail
  useEffect(() => {
    let ignore = false;
    setQuickLoading(true);
    mark('ss:home:quick:start');
    getProjectsQuick()
      .then((list) => !ignore && setQuickProjects(list))
      .catch(() => {})
      .finally(() => {
        !ignore && setQuickLoading(false);
        measure('perf:home:quick', 'ss:home:quick:start');
      });
    return () => { ignore = true; };
  }, []);

  // ---- KPIs: debounced, cancelable fetch ----
  const debounceRef = useRef(null);
  const requestRef = useRef({ abort: () => {} });
  const latestParamsRef = useRef({ range: statsRange, projectId: statsProjectId });

  useEffect(() => {
    latestParamsRef.current = { range: statsRange, projectId: statsProjectId };

    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }

    const controller = new AbortController();
    if (requestRef.current && typeof requestRef.current.abort === 'function') requestRef.current.abort();
    requestRef.current = controller;

    debounceRef.current = setTimeout(() => {
      const { range, projectId } = latestParamsRef.current;
      setStatsLoading(true);
      setStatsError('');
      const params = { range };
      if (projectId && projectId !== 'all') params.projectId = projectId;

      mark('ss:home:stats:start');
      client
        .get('/users/me/stats', { params, signal: controller.signal })
        .then((res) => { if (!controller.signal.aborted) setStats(res.data); })
        .catch((e) => { if (!controller.signal.aborted) setStatsError(String(e?.message || e)); })
        .finally(() => {
          if (!controller.signal.aborted) setStatsLoading(false);
          measure('perf:home:stats', 'ss:home:stats:start');
        });
    }, 220);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); controller.abort(); };
  }, [statsRange, statsProjectId]);

  // Header bits
  const firstName = user?.firstName || 'User';
  const username = user?.username;
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC;

  // Momentum data
  const sprintDays = (stats?.activitySeries || [])
    .filter(d => d && (d.date || d.t))
    .map(d => ({ date: d.date || d.t, count: Number(d.sprints || d.count || 0) }));
  const activeDays14 = Number(stats?.activeDays?.last14 || stats?.activeDays?.value || 0);

  // Smart search handler (stub)
  const handleAsk = (q) => {
    if (!q?.trim()) return;
    alert(`AI (stub): "${q}"\n\n– Last week: 5 tasks completed\n– Risk: 1 overdue task\n– Suggestion: Do a 25m sprint on “Marketing plan v2”`);
  };

  // Coach suggestion from throughput (Thiel)
  const coachSuggestion = useMemo(() => {
    const throughput = stats?.throughputPerWeek?.value ?? 0;
    if (throughput >= 5) return 'Stack two 25-min sprints on your top project; finish with a 10-min review.';
    return 'Start a single 25-min sprint on the highest-impact task, then capture blockers and schedule a follow-up.';
  }, [stats]);

  // celebration flicker
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 900);
    return () => clearTimeout(t);
  }, [celebrate]);

  // one-click 10× launcher
  const launchTenX = () => {
    setTenxOpen(true);
    document.getElementById('focus-sprint')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { track('sprint_started', { mode: '10x', source: 'tenx_card' }); } catch {}
    try { window.dispatchEvent(new CustomEvent('start-tenx-sprint')); } catch {}
  };

  // global sprint progress bar: indeterminate (2s) → linear for remaining time
  useEffect(() => {
    let timer = null;
    const onStart = () => {
      setSprintStart(Date.now());
      setSprintActive(true);
      try { track('sprint_started', { mode: '10x', source: 'event' }); } catch {}
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // after 2s, we’ll switch rendering to linear using sprintStart
      }, 2000);
      // auto-stop after 25m as fallback
      const stop = setTimeout(() => setSprintActive(false), 25 * 60 * 1000);
      return () => clearTimeout(stop);
    };
    window.addEventListener('start-tenx-sprint', onStart);
    return () => { window.removeEventListener('start-tenx-sprint', onStart); if (timer) clearTimeout(timer); };
  }, []);

  // Feed drawer: focus trap + Esc
  useEffect(() => {
    if (!drawerItem) return;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerItem(null); };
    window.addEventListener('keydown', onKey);
    setTimeout(() => drawerFirstBtnRef.current?.focus(), 0);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [drawerItem]);

  // linear progress percent
  const linearPct = (() => {
    if (!sprintActive || !sprintStart) return 0;
    const elapsed = Date.now() - sprintStart;
    const total = 25 * 60 * 1000;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  })();

  return (
    <div className={`home-page relative ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto space-y-7 ${celebrate ? 'win-glow' : ''}`}>
      <PageStyles />

      {/* Thin top progress bar during active sprint */}
      {sprintActive && (
        <div className="top-progress" role="status" aria-live="polite">
          {/* show indeterminate for first 2s after start, then linear width */}
          {(Date.now() - (sprintStart || 0)) < 2000
            ? <span className="indet" />
            : <div className="linear" style={{ width: `${linearPct}%` }} />}
        </div>
      )}

      {/* Header */}
      <HomeHeader
        username={username}
        firstName={firstName}
        profilePic={profilePic}
        tier={user?.tier || 'Newcomer'}
        xp={user?.totalXP || 0}
        onInvite={() => setInviteOpen(true)}
      />

      {/* Top spine: KPI strip + Smart Search (row aura unified) */}
      <div className="row-accent row-accent-violet grid grid-cols-1 lg:grid-cols-3 gap-3 row-grid">
        {SHOW_KPI_STRIP && (
          <div className="lg:col-span-2">
            <KpiStrip stats={stats} />
          </div>
        )}
        {SHOW_SMART_SEARCH && <SmartSearch onAsk={handleAsk} />}
      </div>

      {/* HERO: Focus Sprint with one-click Start (behind HABITS flag to avoid empty shell) */}
      {HABITS_ENABLED && (
        <div className="relative" id="focus-sprint">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-xl opacity-60
                       bg-gradient-to-r from-indigo-100 via-fuchsia-100 to-pink-100
                       dark:from-indigo-900/40 dark:via-fuchsia-900/35 dark:to-pink-900/35" />
          <div className="flex items-center justify-between mb-2">
            <SectionHeader icon="Timer">Focus Sprint</SectionHeader>
            <button
              className="btn btn--primary marching focus-ring"
              title="Start 25:00 now"
              onClick={() => {
                try { track('sprint_started', { mode: '10x', source: 'start_button' }); } catch {}
                try { window.dispatchEvent(new CustomEvent('start-tenx-sprint')); } catch {}
              }}
            >
              Start 25:00
            </button>
          </div>
          <FocusSprint nextTask={null} onFinish={() => setCelebrate(true)} />
        </div>
      )}

      {/* Social + AI + 10× + Transparency */}
      <div className="row-accent row-accent-cyan grid grid-cols-1 lg:grid-cols-3 gap-3 row-grid feed">
        {SHOW_FEED && <MicroFeed onOpen={setDrawerItem} />}
        {SHOW_AI_COACH && <AiCoachCard nextBest={coachSuggestion} />}
        {SHOW_TENX && (
          <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
            <span className="accent-bar__left" aria-hidden="true" />
            <div className="text-sm font-semibold mb-1">Need a push?</div>
            <p className="text-sm text-muted mb-2">Try 10× Mode — a 30-minute hyper-focus block.</p>
            <div className="flex items-center gap-2">
              <button className="btn btn--primary marching" onClick={launchTenX}>Enter 10× Mode</button>
              {TRANSPARENCY_ENABLED && (
                <button
                  className={`btn ${publicMode ? 'btn--primary' : 'btn--outline'}`}
                  onClick={() => setPublicMode(v => !v)}
                  title="Transparency mode"
                >
                  {publicMode ? 'Public On' : 'Transparency'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optional: public mode cards (only if transparency feature is enabled) */}
      {TRANSPARENCY_ENABLED && publicMode && SHOW_LEADERBOARD && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Leaderboard />
          {/* Proof / share tile */}
          <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
            <span className="accent-bar__left" aria-hidden="true" />
            <div className="text-sm font-semibold mb-1">Public dashboard</div>
            <div className="text-xs text-muted">Read-only URL</div>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                className="flex-1 text-xs rounded-md border border-border bg-surface px-2 py-1"
                value={`${window.location.origin}/u/${username || 'me'}/public`}
              />
              <button
                className="btn btn--outline focus-ring"
                onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/u/${username || 'me'}/public`)}
              >
                Copy link
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">updated just now</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">viewers: 0</span>
            </div>
          </div>
        </div>
      )}

      {/* Habits row (behind HABITS flag) */}
      {HABITS_ENABLED && (
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-xl opacity-55
                       bg-gradient-to-r from-cyan-100 via-teal-100 to-emerald-100
                       dark:from-cyan-900/35 dark:via-teal-900/30 dark:to-emerald-900/30" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 row-grid habits">
            <CadenceMeter activeDays={activeDays14} range={14} />
            <div className="md:col-span-2">
              <SprintMomentum data={sprintDays} range={7} />
            </div>
          </div>
        </div>
      )}

      {/* Your Projects */}
      <div className="card shine accent-bar rounded-2xl border border-border bg-surface p-4 relative focus-ring">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <SectionHeader icon="LayoutDashboard">Your Projects</SectionHeader>
        </div>
        <div className="mt-3">
          <ProjectsRail items={quickProjects} loading={quickLoading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="card shine accent-bar rounded-2xl border border-border bg-surface p-4 relative focus-ring" id="kpis" aria-live="polite">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <SectionHeader icon="BarChartBig">Your KPIs</SectionHeader>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted">Project</label>
          <select
            value={statsProjectId}
            onChange={(e) => setStatsProjectId(e.target.value)}
            className="text-sm rounded-md border border-border bg-surface text-text px-2 py-1"
            aria-label="Project filter"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.title}
              </option>
            ))}
          </select>

        <label className="text-xs text-muted ml-2">Range</label>
          <select
            value={statsRange}
            onChange={(e) => setStatsRange(Number(e.target.value))}
            className="text-sm rounded-md border border-border bg-surface text-text px-2 py-1"
            aria-label="Stats time range"
          >
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
        </div>

        <div className="mt-3">
          {statsLoading ? (
            <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
              Loading KPIs…
            </div>
          ) : statsError ? (
            <div className="rounded-2xl border border-rose-200/60 bg-surface p-3 flex items-center justify-between">
              <span className="text-rose-600">Couldn’t load KPIs.</span>
              <button className="btn btn--outline focus-ring" onClick={() => setStatsRange(r => r)} title="Retry (Ctrl+R)">Retry</button>
            </div>
          ) : !stats ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
              No KPI data yet. Start a 25:00 sprint to generate your first metrics.{' '}
              <a className="underline" href="#focus-sprint">Learn how to create activity</a>.
            </div>
          ) : (
            <>
              <KpiRow
                cadence={stats?.cadence}
                onTimeCompletion={stats?.onTimeCompletion}
                activeDays={stats?.activeDays}
                throughputPerWeek={stats?.throughputPerWeek}
              />
              <div className="text-xs text-muted mt-2">
                Benchmarks: top 10% users complete 5+ sprints/week · aim for on-time &gt; 80%.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity Over Time */}
      <div className="card shine accent-bar rounded-2xl border border-border bg-surface p-4 relative focus-ring" data-section="activity-over-time">
        <span className="accent-bar__left" aria-hidden="true" />
        <SectionHeader icon="ActivitySquare">Activity Over Time</SectionHeader>
        <div className="mt-3">
          {statsLoading ? (
            <div className="h-28 rounded-2xl bg-surface animate-pulse" />
          ) : (!stats?.activitySeries || stats?.activitySeries.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
              No activity yet. Sprints and task updates will appear here.{' '}
              <a className="underline" href="#focus-sprint">Learn how to create activity</a>.
            </div>
          ) : (
            <Suspense fallback={<div className="h-28 rounded-2xl bg-surface animate-pulse" />}>
              <ActivityOverTimeLive
                range={statsRange}
                projectId={statsProjectId !== 'all' ? statsProjectId : undefined}
                series={stats?.activitySeries ?? []}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div id="recent-activity" className="card shine accent-bar rounded-2xl border border-border bg-surface p-4 relative focus-ring">
        <span className="accent-bar__left" aria-hidden="true" />
        <SectionHeader icon="History">Recent Activity</SectionHeader>
        <div className="mt-2">
          <AuditList scope="user" />
        </div>
      </div>

      {/* Right drawer for feed item */}
      {drawerItem && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Activity details">
          <div onClick={() => setDrawerItem(null)} />
          <div className="drawer__panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Activity details</div>
              <button ref={drawerFirstBtnRef} className="btn btn--ghost focus-ring" onClick={() => setDrawerItem(null)}>Close</button>
            </div>
            <div className="mt-3 text-sm">
              <div><span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 uppercase">type</span></div>
              <div className="mt-2"><span className="font-medium">{drawerItem.who}</span> {drawerItem.action}</div>
              {drawerItem.project && <div className="text-muted mt-1">Project: {drawerItem.project}</div>}
              <div className="text-muted mt-1">{drawerItem.when}</div>
              <div className="mt-3">
                <a href="#recent-activity" className="btn btn--outline focus-ring" onClick={() => setDrawerItem(null)}>View in timeline</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite teammates */}
      {inviteOpen && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          inviterId={authUser?._id || user?._id || null}
          projectId={null}
        />
      )}

      {/* 10× overlay */}
      <TenXOverlay open={tenxOpen} onClose={() => setTenxOpen(false)} />
    </div>
  );
}

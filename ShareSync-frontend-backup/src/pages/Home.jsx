// src/pages/Home.jsx
import React, {
  useState,
  useEffect,
  useContext,
  Suspense,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { AuthContext } from "../AuthContext";
import { mark, measure } from "../utils/perfLog";
import { track } from "../utils/telemetry";
import ProjectsRail from "../components/home/ProjectsRail.jsx";
import KpiRow from "../components/analytics/KpiRow.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import InviteModal from "../components/invite/InviteModal";
import FocusSprint from "../components/home/FocusSprint.jsx";
import CadenceMeter from "../components/habits/CadenceMeter.jsx";
import SprintMomentum from "../components/habits/SprintMomentum.jsx";
import useSprint from "../hooks/useSprint";
import SprintCompleteModal from "../components/focus/SprintCompleteModal.jsx";
import { REACTIONS_V1 } from "../config/flags";
import ReactionBar from "../components/reactions/ReactionBar.jsx";
import { buildUnreadMap, setLastSeen } from "../utils/stories";
import PageHeader from "../components/layout/PageHeader.jsx";
import {
  KPI_STRIP_ENABLED,
  SMART_SEARCH_ENABLED,
  FEED_ENABLED,
  AI_COACH_ENABLED,
  TENX_ENABLED,
  LEADERBOARD_ENABLED,
  TRANSPARENCY_ENABLED,
  HABITS_ENABLED,
  DISCOVERY_V1,
} from "../config/flags";
import DiscoveryFeed from "../components/discovery/DiscoveryFeed.jsx";
import TabbedFeed from "../components/feed/TabbedFeed.jsx";
import ProjectStoriesBar from "../components/projects/ProjectStoriesBar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SkeletonBlock from "../components/skeleton/SkeletonBlock.jsx";

// NEW IMPORTS
import { fetchAudit } from "../services/audit";
import { useToast } from "../context/ToastContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import "./Home.css";
import TodayCapsule from "../components/home/TodayCapsule.jsx";

const ActivityOverTimeLive = React.lazy(() =>
  import("../components/analytics/ActivityOverTimeLive.jsx")
);

const DEFAULT_PROFILE_PIC = "/default-profile.png";

/* ================= Feature flags ================= */
const SHOW_KPI_STRIP = KPI_STRIP_ENABLED;
const SHOW_SMART_SEARCH = SMART_SEARCH_ENABLED;
const SHOW_FEED = FEED_ENABLED;
const SHOW_AI_COACH = AI_COACH_ENABLED;
const SHOW_TENX = TENX_ENABLED;
const SHOW_LEADERBOARD = LEADERBOARD_ENABLED;
/* ================================================ */

/* ---------------- helpers / inline components ---------------- */
const PageStyles = () => (
  <style>{`
    .home-page { row-gap: 1.5rem; }
    @media (min-width: 768px) { .home-page { row-gap: 1.75rem; } }
    .kpi-strip .card::before { opacity: .28 !important; filter: blur(20px) !important; }
    .row-accent > .card.card--no-inner::before { display:none; }
    .focus-ring:focus-visible { outline: 2px solid var(--accent, #6366f1); outline-offset: 2px; border-radius: 14px; }
    .row-grid { align-items: stretch; }
    .row-grid > * { min-height: 112px; }
    .row-grid.feed > * { min-height: 188px; }
    .row-grid.habits > * { min-height: 146px; }
    .top-progress { position: sticky; top: 0; left: 0; right: 0; height: 3px; z-index: 70; background: transparent; }
    .top-progress .indet { display:block; height:100%; width:35%; background: linear-gradient(90deg,#6366f1,#ec4899);
      animation: tp 1.2s ease-in-out infinite; border-radius: 999px; opacity:.85; }
    @keyframes tp { 0% {margin-left:0%} 50%{margin-left:65%} 100%{margin-left:0%} }
    .top-progress .linear { height:100%; background: linear-gradient(90deg,#6366f1,#ec4899); border-radius:999px; }
    .drawer { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.34); display:grid; grid-template-columns: 1fr auto; }
    .drawer__panel { width:min(420px,90vw); background: var(--surface,#fff); border-left: 1px solid var(--border,#e5e7eb);
      box-shadow: -12px 0 32px rgba(2,6,23,.10); }
  `}</style>
);

function Chip({ tone = "neutral", children, className = "", onClick }) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : tone === "bad"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300";
  const Cmp = onClick ? "button" : "span";
  return (
    <Cmp
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] ${toneCls} ${
        onClick ? "cursor-pointer hover:opacity-90" : ""
      } ${className}`}
    >
      {children}
    </Cmp>
  );
}

const pct = (a, b) => {
  const A = Number(a ?? 0),
    B = Number(b ?? 0);
  if (B === 0) return A === 0 ? 0 : 100;
  return Math.round(((A - B) / Math.max(1, Math.abs(B))) * 100);
};

function Sparkline({ data, w = 96, h = 18, title }) {
  const arr = Array.isArray(data) && data.length ? data : Array(7).fill(1);
  const max = Math.max(...arr, 1);
  const min = Math.min(...arr, 0);
  const last = arr[arr.length - 1] ?? 0;
  const pad = 2;
  const xStep = (w - pad * 2) / (arr.length - 1 || 1);
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const path = arr
    .map((v, i) => `${i === 0 ? "M" : "L"} ${pad + xStep * i} ${y(v)}`)
    .join(" ");
  const tt = title ?? `7d · min ${min} · max ${max} · last ${last}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block mt-2"
      role="img"
      aria-label={tt}
      title={tt}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ----------------------- RecentActivity Component ----------------- */
/* ------------------------------------------------------------------ */
const RecentActivity = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAudit({ scope: "user", limit: 20 });
        if (mounted && data?.items) {
          setItems(data.items);
        }
      } catch (err) {
        const msg = err.response?.status === 404
          ? "Audit log not available yet."
          : err.message || "Failed to load activity";
        if (mounted) {
          setError(msg);
          if (err.response?.status !== 404) {
            addToast({
              title: "Activity failed to load",
              description: msg,
              variant: "destructive",
            });
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [addToast]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
            <div className="flex-1">
              <div className="h-3 bg-surface rounded animate-pulse w-3/4" />
              <div className="h-2 bg-surface rounded animate-pulse w-1/2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">
          {error
            ? error
            : "No activity yet. Start a task to see updates here."}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item._id}
          className="flex items-center justify-between text-sm p-2 rounded hover:bg-surface/60 dark:hover:bg-surface/40 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
              {item.type}
            </span>
            <span className="font-medium">{item.actor?.name || "You"}</span>
            <span className="text-muted">{item.action}</span>
          </div>
          <span className="text-xs text-muted">
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ------------------------------------------------------------------ */
/* -------------------------- KPI Strip ----------------------------- */
/* ------------------------------------------------------------------ */
function KpiStrip({ stats, meId }) {
  const today = stats?.today || {};
  const cmp = stats?.compare?.today || {};
  const ts = stats?.timeseries || {};
  const why = stats?.attribution || {};

  const tiles = [
    { key: "tasksDone", label: "Tasks done", value: today.tasksDone ?? "—", prev: cmp.tasksDone },
    { key: "focusMins", label: "Focus mins", value: today.focusMins ?? "—", prev: cmp.focusMins },
    { key: "streak", label: "Streak", value: (stats?.streak ?? 0) + "d", prev: stats?.compare?.streak ?? 0 },
    { key: "onTime", label: "On-time %", value: stats?.onTimeCompletion?.pct ?? "—", prev: stats?.compare?.onTimePct },
  ];

  const tputs = stats?.throughputPerWeek || {};
  const velocity =
    Number(tputs.prev ?? 0) === 0
      ? Number(tputs.value ?? 0) > 0
        ? 1
        : 0
      : Number(tputs.value ?? 0) / Number(tputs.prev ?? 1);
  const velocityText = Number.isFinite(velocity)
    ? `${velocity.toFixed(1)}× ${velocity >= 1 ? "faster" : "slower"}`
    : "—";

  const goKPIs = (reason) => {
    try { track("kpi_strip_tile_clicked", { tile: reason }); } catch {}
    document.getElementById("kpis")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="kpi-strip grid grid-cols-2 sm:grid-cols-4 gap-3 row-grid">
      {tiles.map((t) => {
        const delta = pct(t.value, t.prev);
        const tone = delta > 0 ? "good" : delta < 0 ? "bad" : "neutral";
        const seriesObj = ts?.[t.key];
        const series = seriesObj?.last7 || seriesObj || [];
        const min = Array.isArray(series) && series.length ? Math.min(...series) : 0;
        const max = Array.isArray(series) && series.length ? Math.max(...series) : 0;
        const last = Array.isArray(series) && series.length ? series[series.length - 1] : 0;
        const whyLine = why?.[t.key]?.top?.label
          ? `${why?.[t.key]?.top?.delta > 0 ? "+" : ""}${why?.[t.key]?.top?.delta ?? ""} from ${why?.[t.key]?.top?.label}`
          : null;

        return (
          <div
            key={t.key}
            role="button"
            tabIndex={0}
            onClick={() => goKPIs(t.key)}
            onKeyDown={(e) => e.key === "Enter" && goKPIs(t.key)}
            className="card rounded-2xl p-3 shine accent-bar relative hover:cursor-pointer hover-raise focus-ring"
            aria-label={`Open KPIs filtered by ${t.label}`}
            title={`7d ${t.label} · min ${min} · max ${max} · last ${last}`}
          >
            <span className="accent-bar__left" aria-hidden="true" />
            <div className="text-2xl font-bold num">{t.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-muted">{t.label}</div>
              <Chip tone={tone} onClick={() => goKPIs(t.key)}>
                {delta >= 0 ? "up" : "down"} <span className="num">{Math.abs(delta)}</span>%
              </Chip>
            </div>
            <Sparkline data={series} />
            {whyLine && <div className="text-[10px] text-muted mt-1">{whyLine}</div>}
            {REACTIONS_V1 && (
              <ReactionBar targetId={`kpi:${t.key}`} ownerId={meId} meId={meId} label={t.label} />
            )}
          </div>
        );
      })}

      <div
        role="button"
        tabIndex={0}
        onClick={() => goKPIs("velocity")}
        onKeyDown={(e) => e.key === "Enter" && goKPIs("velocity")}
        className="card rounded-2xl p-3 shine accent-bar relative sm:col-span-2 hover:cursor-pointer hover-raise focus-ring"
        title="See detailed throughput and goals"
      >
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Velocity</div>
            <div className="text-lg font-semibold num">{velocityText}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Goal</div>
            <div className="text-sm">
              {(stats?.goal?.label ?? "2 sprints/day")}
              <span className="text-muted"> · benchmark: top 10% do 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* -------------------------- Smart Search -------------------------- */
/* ------------------------------------------------------------------ */
function SmartSearch({ onAsk, stats }) {
  const [q, setQ] = useState("");
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const inText = tag === "input" || tag === "textarea";
      const cmdK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      if ((e.key === "/" || cmdK) && !inText) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQ("");
        setAnswers([]);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sum = (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b || 0), 0) : 0);

  const completedLast7 = () => {
    const series = stats?.timeseries?.tasksDone;
    if (Array.isArray(series?.last7)) return sum(series.last7);
    if (Array.isArray(series)) return sum(series.slice(-7));
    return Number(stats?.today?.tasksDone ?? 0);
  };
  const overdueThisWeek = () => Number(stats?.overdueThisWeek?.value ?? stats?.overdue7d ?? 0);
  const streakThisMonth = () => Number(stats?.activeDays?.last30 ?? stats?.activeDays?.value ?? 0);

  const clickReport = (hit) => {
    try { track("smartsearch_answer_click", { hit }); } catch {}
  };

  const hints = ["what did i complete last week", "overdue this week", "streak this month"];

  const run = (query) => {
    if (!query?.trim()) return;
    const q = query.trim().toLowerCase();

    const isCompleted7 =
      q.includes("what did i complete last week") ||
      (q.includes("complete") && (q.includes("last week") || q.includes("past week") || q.includes("7")));
    const isOverdue7 =
      q.includes("overdue this week") ||
      (q.includes("overdue") && (q.includes("this week") || q.includes("past week") || q.includes("7")));
    const isStreak30 =
      q.includes("streak this month") ||
      (q.includes("streak") && (q.includes("this month") || q.includes("30")));

    let answer = "";
    let anchor = "#recent-activity";

    if (isCompleted7) {
      const n = completedLast7();
      answer = `Completed ${n} task${n === 1 ? "" : "s"} last week`;
      anchor = "#recent-activity";
      try { track("smartsearch_query", { q, hit: "completed_last_week", value: n }); } catch {}
    } else if (isOverdue7) {
      const n = overdueThisWeek();
      answer = `${n} overdue task${n === 1 ? "" : "s"} this week`;
      anchor = "#kpis";
      try { track("smartsearch_query", { q, hit: "overdue_this_week", value: n }); } catch {}
    } else if (isStreak30) {
      const n = streakThisMonth();
      answer = `Active on ${n} day${n === 1 ? "" : "s"} this month`;
      anchor = "#kpis";
      try { track("smartsearch_query", { q, hit: "streak_this_month", value: n }); } catch {}
    } else {
      answer = 'Try: “what did i complete last week” • “overdue this week” • “streak this month”';
      anchor = "#kpis";
      try { track("smartsearch_query", { q, hit: "fallback" }); } catch {}
    }

    setAnswers([{ text: answer, anchor }]);
    onAsk(query);
    if (resultsRef.current) resultsRef.current.textContent = answer;
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % hints.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i - 1 + hints.length) % hints.length);
    } else if (e.key === "Enter" && selected >= 0) {
      const h = hints[selected];
      setQ(h);
      run(h);
    } else if (e.key === "Enter") {
      run(q);
    }
  };

  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring min-h-[112px]">
      <span className="accent-bar__left" aria-hidden="true" />
      <div ref={resultsRef} aria-live="polite" className="sr-only" />
      {answers.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md border border-border bg-surface">
            {answers[0].text} ·{" "}
            <a href={answers[0].anchor} className="underline" onClick={() => clickReport(answers[0].text)}>
              View report
            </a>
          </span>
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
        <button className="btn btn--outline" onClick={() => run(q)}>
          Ask AI
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {["what did i complete last week", "overdue this week", "streak this month"].map((h, i) => (
          <button
            key={h}
            className={`btn btn--ghost text-xs ${selected === i ? "ring-2 ring-accent" : ""}`}
            onMouseEnter={() => setSelected(i)}
            onFocus={() => setSelected(i)}
            onClick={() => {
              setQ(h);
              run(h);
            }}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* -------------------------- Micro Feed, AI Coach, Leaderboard ---- */
/* ------------------------------------------------------------------ */
const MOCK_FEED = [
  { id: "1", type: "task", who: "Manny", action: "completed 3 tasks", when: "2m ago", project: "Launch Alpha" },
  { id: "2", type: "sprint", who: "Alex", action: "started a sprint", when: "10m ago", project: "Growth" },
  { id: "3", type: "due", who: "Jordan", action: "added a due date", when: "27m ago", project: "Docs" },
];
function MicroFeed({ items = MOCK_FEED, onOpen }) {
  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="text-sm font-semibold mb-2">What’s happening</div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(i)}
            onKeyDown={(e) => e.key === "Enter" && onOpen?.(i)}
            className="flex items-center justify-between text-sm hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded px-2 py-1 focus-ring"
            title="Open details"
          >
            <div className="truncate flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 uppercase tracking-wide">
                {i.type}
              </span>
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
function AiCoachCard({ nextBest }) {
  return (
    <div className="card rounded-2xl p-3 shine accent-bar relative focus-ring">
      <span className="accent-bar__left" aria-hidden="true" />
      <div className="text-sm font-semibold">AI Sprint Coach</div>
      <p className="text-sm text-muted mt-1">
        Suggested plan: {nextBest || "Start a 25-min sprint on the top impact task, then a 5-min review."}
      </p>
      <div className="mt-2 flex gap-2">
        <button className="btn btn--outline">Start plan</button>
        <button className="btn btn--outline">Regenerate</button>
      </div>
    </div>
  );
}
const MOCK_BOARD = [
  { id: "m", name: "Manny", streak: 3 },
  { id: "a", name: "Alex", streak: 2 },
  { id: "j", name: "Jordan", streak: 1 },
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
function TenXOverlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 grid place-items-center">
      <div className="card rounded-2xl p-5 w-[min(720px,95vw)] relative">
        <button className="btn btn--ghost absolute top-2 right-2" onClick={onClose}>
          Close
        </button>
        <div className="text-lg font-bold mb-2">10× Mode</div>
        <p className="text-sm text-muted mb-3">
          30-minute hyper-focus block: queue a task, start a timer, mute distractions, and show progress pulses.
        </p>
        <div className="flex gap-2">
          <button className="btn btn--primary marching" onClick={onClose}>
            Launch sequence
          </button>
          <button className="btn btn--outline" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------- Page ----------------------------- */
/* ------------------------------------------------------------------ */
export default function Home() {
  mark("ss:home:render:start");

  const { user: authUser } = useContext(AuthContext) || {};
  const meId = authUser?._id || authUser?.id || "me";
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const [quickProjects, setQuickProjects] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);

  const storiesProjects = useMemo(
    () =>
      Array.isArray(quickProjects)
        ? quickProjects.map((p) => ({ ...p, name: p?.name || p?.title }))
        : [],
    [quickProjects]
  );
  const unreadMap = useMemo(() => buildUnreadMap(storiesProjects), [storiesProjects]);

  const [projects, setProjects] = useState([]);
  const [statsRange, setStatsRange] = useState(30);
  const [statsProjectId, setStatsProjectId] = useState("all");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [tenxOpen, setTenxOpen] = useState(false);
  const [sprintDoneOpen, setSprintDoneOpen] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [publicMode, setPublicMode] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintStart, setSprintStart] = useState(null);

  const [drawerItem, setDrawerItem] = useState(null);
  const drawerFirstBtnRef = useRef(null);

  const kpiRef = useRef(null);
  useEffect(() => {
    if (!SHOW_KPI_STRIP) return;
    const el = kpiRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      try { track("kpi_strip_viewed", { fallback: true }); } catch {}
      return;
    }
    let fired = false;
    const obs = new IntersectionObserver(
      (entries) => {
        const en = entries[0];
        if (!fired && en.isIntersecting && en.intersectionRatio >= 0.25) {
          fired = true;
          try { track("kpi_strip_viewed"); } catch {}
          obs.disconnect();
        }
      },
      { threshold: [0.25, 0.5, 0.75] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const tab = e?.detail?.tab ?? e?.detail ?? null;
      try { track("feed_tab_changed", { tab }); } catch {}
    };
    window.addEventListener("feed:tab_changed", handler);
    window.addEventListener("feed:tab-changed", handler);
    return () => {
      window.removeEventListener("feed:tab_changed", handler);
      window.removeEventListener("feed:tab-changed", handler);
    };
  }, []);

  useEffect(() => {
    measure("perf:home:first-render", "ss:home:render:start");
  }, []);

  useEffect(() => {
    mark("ss:home:bootstrap:start");
    Promise.all([
      client.get("/users/me").catch(() => client.get("/user/me")),
      client.get("/projects").catch(() => ({ data: [] })),
    ])
      .then(([userRes, projRes]) => {
        setUser(userRes.data);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
      })
      .catch(() => {})
      .finally(() => {
        measure("perf:home:bootstrap", "ss:home:bootstrap:start");
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    setQuickLoading(true);
    mark("ss:home:quick:start");
    getProjectsQuick()
      .then((list) => !ignore && setQuickProjects(list))
      .catch(() => {})
      .finally(() => {
        !ignore && setQuickLoading(false);
        measure("perf:home:quick", "ss:home:quick:start");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const debounceRef = useRef(null);
  const requestRef = useRef({ abort: () => {} });
  const latestParamsRef = useRef({ range: statsRange, projectId: statsProjectId });

  useEffect(() => {
    latestParamsRef.current = { range: statsRange, projectId: statsProjectId };
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const controller = new AbortController();
    if (requestRef.current && typeof requestRef.current.abort === "function")
      requestRef.current.abort();
    requestRef.current = controller;

    debounceRef.current = setTimeout(() => {
      const { range, projectId } = latestParamsRef.current;
      setStatsLoading(true);
      setStatsError("");
      const params = { range };
      if (projectId && projectId !== "all") params.projectId = projectId;

      mark("ss:home:stats:start");
      client
        .get("/users/me/stats", { params, signal: controller.signal })
        .then((res) => {
          if (!controller.signal.aborted) setStats(res.data);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setStatsError(String(e?.message || e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setStatsLoading(false);
          measure("perf:home:stats", "ss:home:stats:start");
        });
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [statsRange, statsProjectId]);

  const firstName = user?.firstName || "User";
  const username = user?.username;
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC;

  const sprintDays = (stats?.activitySeries || [])
    .filter((d) => d && (d.date || d.t))
    .map((d) => ({ date: d.date || d.t, count: Number(d.sprints || d.count || 0) }));
  const activeDays14 = Number(stats?.activeDays?.last14 || stats?.activeDays?.value || 0);

  const handleAsk = (q) => {
    if (!q?.trim()) return;
    alert(
      `AI (stub): "${q}"\n\n– Last week: 5 tasks completed\n– Risk: 1 overdue task\n– Suggestion: Do a 25m sprint on “Marketing plan v2”`
    );
  };

  const coachSuggestion = useMemo(() => {
    const throughput = stats?.throughputPerWeek?.value ?? 0;
    if (throughput >= 5)
      return "Stack two 25-min sprints on your top project; finish with a 10-min review.";
    return "Start a single 25-min sprint on the highest-impact task, then capture blockers and schedule a follow-up.";
  }, [stats]);

  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 900);
    return () => clearTimeout(t);
  }, [celebrate]);

  const launchTenX = () => {
    setTenxOpen(true);
    document.getElementById("focus-sprint")?.scrollIntoView({ behavior: "smooth", block: "center" });
    try { track("sprint_started", { mode: "10x", source: "tenx_card" }); } catch {}
    try { window.dispatchEvent(new CustomEvent("start-tenx-sprint")); } catch {}
  };

  useEffect(() => {
    let timer = null;
    const onStart = () => {
      setSprintStart(Date.now());
      setSprintActive(true);
      try { track("sprint_started", { mode: "10x", source: "event" }); } catch {}
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {}, 2000);
      const stop = setTimeout(() => setSprintActive(false), 25 * 60 * 1000);
      return () => clearTimeout(stop);
    };
    window.addEventListener("start-tenx-sprint", onStart);
    return () => {
      window.removeEventListener("start-tenx-sprint", onStart);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useSprint({
    durationMs: 25 * 60 * 1000,
    onDone: () => {
      setRecentCompleted([]);
      setSprintDoneOpen(true);
    },
  });

  useEffect(() => {
    if (!drawerItem) return;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerItem(null);
    };
    window.addEventListener("keydown", onKey);
    setTimeout(() => drawerFirstBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [drawerItem]);

  const linearPct = (() => {
    if (!sprintActive || !sprintStart) return 0;
    const elapsed = Date.now() - (sprintStart || 0);
    const total = 25 * 60 * 1000;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  })();

  const openStory = (p) => {
    const pid = p?._id || p?.id;
    if (!pid) return;
    try { setLastSeen(pid, Date.now()); } catch {}
    navigate(`/projects/${pid}`);
  };

  const pickLastProject = () => {
    const list = Array.isArray(quickProjects) && quickProjects.length ? quickProjects : projects;
    if (!Array.isArray(list) || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.lastActivityAt || a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.lastActivityAt || b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
    return sorted[0];
  };

  const continueProject = () => {
    const last = pickLastProject();
    if (!last) return;
    const pid = last._id || last.id;
    try { track("home_primary_cta_clicked", { cta: "continue_project", projectId: pid }); } catch {}
    navigate(`/projects/${pid}`);
  };

  const start25 = () => {
    try { track("home_secondary_cta_clicked", { cta: "start_25" }); } catch {}
    try { window.dispatchEvent(new CustomEvent("start-tenx-sprint")); } catch {}
    document.getElementById("focus-sprint")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onTodayCapsuleStart = () => {
    try { track("today_capsule_action_started", { source: "home" }); } catch {}
    start25();
  };

  const generatePlan = () => {
    try { track("ai_plan_regenerated", { source: "home" }); } catch {}
    alert("AI Plan: Focus on “Launch Alpha” → 3 tasks → 25-min sprint");
  };

  const userRank = 1; // Mock — replace with real leaderboard rank

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="Home"
        subtitle="AI plan + momentum + quick actions"
      />

      {/* AI Planner */}
      <div className="card glass p-6">
        <h2 className="text-lg font-semibold mb-4">Today’s AI Plan</h2>
        <TodayCapsule />
        <button className="btn btn--primary mt-4 w-full" onClick={generatePlan}>
          Regenerate Plan
        </button>
      </div>

      {/* Momentum */}
      <div className="card glass p-6">
        <h2 className="text-lg font-semibold mb-4">Your Momentum</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{stats?.insights?.streakDays || 0}</div>
            <div className="text-xs text-muted">Day Streak</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats?.xp || 0}</div>
            <div className="text-xs text-muted">XP Earned</div>
          </div>
          <div>
            <div className="text-3xl font-bold">#{userRank}</div>
            <div className="text-xs text-muted">Leaderboard</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="btn btn--primary" onClick={continueProject}>
          Continue Last Project
        </button>
        <button className="btn btn--outline" onClick={start25}>
          Start 25:00 Sprint
        </button>
      </div>
    </div>
  );
}
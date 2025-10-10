import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, Compass, BarChart2, Rss, PlusCircle, Clock } from "lucide-react";
import Button from "../ui/Button.jsx";

// ---- Inject real data via props or use fallbacks ----
// props:
// - user
// - projects: [{id,title,deadline,progress,ownerId}]
// - activity: [{id,type,projectId,actor,summary,createdAt}]
// - metrics: { tasksDone, focusMins, streakDays, onTimePct, velocity, goalSprintsPerDay }
// - onStartSprint?: () => void
export default function HomeHeaderSwitcher({
  user,
  projects = [],
  activity = [],
  metrics = {},
  onStartSprint,
  // allows you to render your existing metric cards inside the Metrics tab
  renderMetricsCards, 
}) {
  const [tab, setTab] = useState(() => localStorage.getItem("ss:home:tab") || "feed");
  useEffect(() => localStorage.setItem("ss:home:tab", tab), [tab]);

  // ---- Derived data (with safe fallbacks) ----
  const me = user?.displayName || user?.name || user?.username || "there";

  const now = Date.now();
  const soonest = useMemo(() => {
    const withDates = (projects || []).map(p => ({...p, due: new Date(p.deadline || p.dueAt || Date.now()+1e9).getTime()}));
    return withDates.sort((a,b) => a.due - b.due)[0] || null;
  }, [projects]);

  const m = {
    tasksDone: metrics.tasksDone ?? 0,
    focusMins: metrics.focusMins ?? 0,
    streakDays: metrics.streakDays ?? 0,
    onTimePct: metrics.onTimePct ?? 100,
    velocity: metrics.velocity ?? 0,
    goalSprintsPerDay: metrics.goalSprintsPerDay ?? 2,
  };

  // Simple “AI-ish” momentum sentence
  const momentumLine = useMemo(() => {
    if (m.streakDays >= 3 && m.tasksDone >= 4) {
      return `On fire, ${me}! ${m.tasksDone} tasks yesterday and a ${m.streakDays}-day streak — keep the wave going.`;
    }
    if (m.streakDays === 0 && m.tasksDone === 0) {
      return `Fresh start, ${me}. Kick off with one high-impact task to build momentum.`;
    }
    if (soonest) {
      const hrs = Math.max(1, Math.round((soonest.due - now)/36e5));
      return `${soonest.title} is due in ~${hrs}h. A 25-min sprint on its top blocker will move the needle.`;
    }
    return `You’re trending ${m.velocity.toFixed(1)}× vs goal (${m.goalSprintsPerDay}/day). One focused block unlocks compounding gains.`;
  }, [m, soonest, me, now]);

  // “Next best action” candidates for Project Compass
  const compassOptions = useMemo(() => {
    const list = [];
    if (soonest) list.push({ 
      id: "due", 
      label: `Advance "${soonest.title}"`, 
      hint: "Tackle the riskiest step before the due date", 
      action: onStartSprint 
    });
    if (m.streakDays === 0) list.push({
      id: "streak",
      label: "Start a 25-min focus sprint",
      hint: "Build today’s streak",
      action: onStartSprint
    });
    list.push({
      id: "inbox",
      label: "Clear 3 quick wins",
      hint: "Reduce mental load in 10 minutes",
      action: () => {}
    });
    return list.slice(0,3);
  }, [soonest, m.streakDays, onStartSprint]);

  // Minimal feed formatter
  const items = (activity || []).slice(0, 10);

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Switcher */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
        <div className="inline-flex bg-white/60 dark:bg-slate-900/50 rounded-xl p-1 border border-border">
          <TabButton icon={Rss}      id="feed"     tab={tab} setTab={setTab}>Feed</TabButton>
          <TabButton icon={Sparkles} id="momentum" tab={tab} setTab={setTab}>Momentum</TabButton>
          <TabButton icon={Compass}  id="compass"  tab={tab} setTab={setTab}>Compass</TabButton>
          <TabButton icon={BarChart2}id="metrics"  tab={tab} setTab={setTab}>Metrics</TabButton>
        </div>

        {/* Quick action slot */}
        <div className="hidden sm:block">
          <Button
            variant="secondary"
            onClick={onStartSprint}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Start 25-min Sprint
          </Button>
        </div>
      </div>

      {/* Panels */}
      <div className="px-4 sm:px-6 py-5">
        {tab === "feed" && <FeedPanel items={items} />}
        {tab === "momentum" && <MomentumPanel me={me} m={m} line={momentumLine} />}
        {tab === "compass" && <CompassPanel options={compassOptions} />}
        {tab === "metrics" && (
          renderMetricsCards 
            ? <div className="pb-1">{renderMetricsCards()}</div>
            : <DefaultMetrics m={m} />
        )}
      </div>
    </section>
  );
}

function TabButton({ id, tab, setTab, icon: Icon, children }) {
    const active = tab === id;
    return (
      <Button
        variant={active ? "primary" : "ghost"}
        size="sm"
        onClick={() => setTab(id)}
        aria-pressed={active}
        leftIcon={<Icon className="w-4 h-4" />}
        className="rounded-lg"
      >
        {children}
      </Button>
    );
  }  

/* ---------- FEED ---------- */
function FeedPanel({ items = [] }) {
  if (!items.length) {
    return (
      <div className="grid place-items-center h-[160px] text-muted">
        No conversations yet. Invite teammates or start a sprint to generate activity.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-white/60 dark:bg-slate-900/40">
      {items.map((ev) => (
        <li key={ev.id} className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Avatar label={ev.actor?.name || "U"} />
            <div className="min-w-0">
              <div className="text-sm">
                <span className="font-medium">{ev.actor?.name || ev.actor || "Someone"}</span>{" "}
                <span className="text-muted">{ev.summary || "did something"}</span>
              </div>
              <div className="text-xs text-muted mt-0.5 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(ev.createdAt || Date.now()).toLocaleString()}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- MOMENTUM ---------- */
function MomentumPanel({ me, m, line }) {
  return (
    <div className="grid md:grid-cols-[1.2fr_.8fr] gap-5 items-center">
      <div>
        <h2 className="text-xl font-semibold">
          {line}
        </h2>
        <p className="text-muted mt-1">
          Momentum = consistent sprints × fewer blockers × fast feedback loops.
        </p>
      </div>

      {/* Pulse rings */}
      <div className="relative grid place-items-center h-[140px]">
        <PulseRing size={140} strength={clamp01(m.streakDays/7)} label={`${m.streakDays}d`} sub="streak" />
        <PulseRing size={110} strength={clamp01(m.onTimePct/100)} label={`${Math.round(m.onTimePct)}%`} sub="on-time" />
        <PulseRing size={80}  strength={clamp01(m.velocity/2)} label={`${m.velocity.toFixed(1)}×`} sub="velocity" />
      </div>
    </div>
  );
}

/* ---------- COMPASS ---------- */
function CompassPanel({ options = [] }) {
  if (!options.length) {
    return <div className="text-muted">No suggestions right now — you’re all clear.</div>;
  }
  return (
    <div className="grid sm:grid-cols-3 gap-3">
    {options.map((opt) => (
      <Button
        key={opt.id}
        variant="secondary"
        onClick={opt.action}
        className="text-left rounded-2xl px-4 py-3 hover:shadow-sm min-h-10"
      >
        <div className="font-semibold">{opt.label}</div>
        <div className="text-xs text-muted mt-1">{opt.hint}</div>
      </Button>
    ))}
  </div>
  );
}

/* ---------- METRICS (fallback) ---------- */
function DefaultMetrics({ m }) {
  const Card = ({ label, value, sub }) => (
    <div className="rounded-2xl border border-border p-4 bg-white/70 dark:bg-slate-900/50">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card label="Tasks done" value={m.tasksDone} />
      <Card label="Focus mins" value={m.focusMins} />
      <Card label="Streak" value={`${m.streakDays}d`} />
      <Card label="On-time" value={`${Math.round(m.onTimePct)}%`} />
    </div>
  );
}

/* ---------- UI bits ---------- */
function Avatar({ label = "U" }) {
  const initials = String(label).trim().slice(0,2).toUpperCase();
  return (
    <div className="grid place-items-center w-8 h-8 rounded-full bg-surface text-ink-700 ring-2 ring-white dark:ring-slate-900 text-[11px] font-semibold">
      {initials}
    </div>
  );
}

function PulseRing({ size = 120, strength = 0.6, label, sub }) {
  const border = Math.max(2, Math.round(4 * strength));
  return (
    <div
      className="absolute rounded-full grid place-items-center"
      style={{
        width: size, height: size,
        boxShadow: `0 0 ${12 + 16*strength}px rgba(99,102,241,${0.25 + 0.35*strength})`,
        border: `${border}px solid rgba(99,102,241,${0.55 + 0.35*strength})`,
      }}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] text-muted -mt-1">{sub}</div>
    </div>
  );
}

function clamp01(x){ return Math.max(0, Math.min(1, x)); }

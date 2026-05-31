from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-sprint-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

needed_icons = [
    "Timer",
    "Calendar",
    "PlayCircle",
    "GaugeCircle",
    "Flag",
    "Route",
]

lucide_end_marker = '} from "lucide-react";'
lucide_end = text.find(lucide_end_marker)

if lucide_end == -1:
    raise SystemExit("❌ Could not find lucide-react import block.")

lucide_start = text.rfind("import {", 0, lucide_end)

if lucide_start == -1:
    raise SystemExit("❌ Could not find lucide-react import start.")

lucide_block = text[lucide_start:lucide_end]
missing = [icon for icon in needed_icons if not re.search(rf"\b{icon}\b", lucide_block)]

if missing:
    insertion = "".join([f"  {icon},\n" for icon in missing])
    text = text[:lucide_end] + insertion + text[lucide_end:]
    print(f"✅ Added missing lucide icons: {', '.join(missing)}")
else:
    print("ℹ️ Sprint icons already imported.")

start = text.find("function SprintCard(")

if start == -1:
    raise SystemExit(
        "❌ Could not find function SprintCard.\n"
        "Run: rg -n \"function SprintCard|SprintCard\" src/pages/ProjectHome.jsx -C 12"
    )

# Use marker replacement instead of brace-matching.
# This avoids the destructured-props issue that caused the previous syntax errors.
candidate_markers = [
    "\nfunction ForesightCard",
    "\nfunction LiveActivityCard",
    "\nfunction TeamCapacityCard",
    "\nfunction ActiveGoalsCard",
    "\nfunction OverviewView",
]

positions = []
for marker in candidate_markers:
    pos = text.find(marker, start + 1)
    if pos != -1:
        positions.append(pos)

if not positions:
    raise SystemExit(
        "❌ Could not find the next component after SprintCard.\n"
        "Run:\n"
        "rg -n \"function SprintCard|function ForesightCard|function LiveActivityCard|function TeamCapacityCard|function ActiveGoalsCard|function OverviewView\" src/pages/ProjectHome.jsx -C 8"
    )

end = min(positions)

new_card = r'''function SprintCard({ sprint = null, tasks = [], onStartSprint } = {}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const isDone = (task) => {
    const status = String(task?.status || task?.state || "").toLowerCase();
    return (
      status === "done" ||
      status === "complete" ||
      status === "completed" ||
      task?.completed === true ||
      task?.isCompleted === true
    );
  };

  const totalTasks = Math.max(
    0,
    Number(sprint?.totalTasks ?? sprint?.taskCount ?? safeTasks.length ?? 0) || 0
  );

  const completedTasks = Math.max(
    0,
    Number(
      sprint?.completedTasks ??
        sprint?.doneTasks ??
        safeTasks.filter((task) => isDone(task)).length ??
        0
    ) || 0
  );

  const progress =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  const hasSprint =
    Boolean(sprint?.active) ||
    Boolean(sprint?.startedAt) ||
    Boolean(sprint?.startDate) ||
    Boolean(sprint?.goal) ||
    Boolean(sprint?.title);

  const sprintGoal =
    sprint?.goal ||
    sprint?.title ||
    "Set a focused 2-week goal to build velocity and shipping rhythm.";

  const sprintState = hasSprint ? "Active rhythm" : "Ready to start";

  const sprintMessage = hasSprint
    ? "Keep the sprint tight: ship the next task, clear friction, and protect momentum."
    : "Create a 2-week execution window so the team knows what must move next.";

  const statCards = [
    {
      label: "Window",
      value: sprint?.windowLabel || sprint?.duration || "2 weeks",
      icon: Calendar,
    },
    {
      label: "Progress",
      value: `${progress}%`,
      icon: GaugeCircle,
    },
    {
      label: "Tasks",
      value: totalTasks > 0 ? `${completedTasks}/${totalTasks}` : "0",
      icon: Flag,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(139,92,246,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-violet-500 to-cyan-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Timer className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Sprint
              </h3>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                Rhythm
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Timeboxed execution plan for focused shipping.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          Live
        </span>
      </header>

      <div className="relative z-10 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Sprint State
            </p>

            <h4 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              {sprintState}
            </h4>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {sprintMessage}
            </p>
          </div>

          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:flex">
            <Route className="h-5 w-5" />
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.035]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                    {card.label}
                  </span>
                </div>

                <p className="text-xl font-black text-slate-950 dark:text-white">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-zinc-400">
              Sprint progress
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="mb-2 flex items-center gap-2">
            <Flag className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              Sprint Focus
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
            {sprintGoal}
          </p>
        </div>

        {!hasSprint ? (
          <button
            type="button"
            onClick={onStartSprint}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15"
          >
            <PlayCircle className="h-4 w-4" />
            Start Your First Sprint
          </button>
        ) : null}
      </div>
    </section>
  );
}

'''

text = text[:start] + new_card + text[end:].lstrip()
path.write_text(text)

print("")
print("✅ SprintCard visually polished.")
print("✅ Added rhythm badge, sprint state, progress rail, stat blocks, and stronger CTA.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function SprintCard|Sprint State|Sprint Focus|Rhythm|Start Your First Sprint" src/pages/ProjectHome.jsx -C 10')

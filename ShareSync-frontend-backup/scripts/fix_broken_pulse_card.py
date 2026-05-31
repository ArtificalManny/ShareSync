from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-fix-broken-pulse-card-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

needed_icons = [
    "Activity",
    "Flame",
    "Zap",
    "AlertTriangle",
    "Play",
    "RadioTower",
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
    print("ℹ️ Pulse icons already imported.")

start = text.find("function OverviewPulseCard(")

if start == -1:
    raise SystemExit("❌ Could not find function OverviewPulseCard(")

# IMPORTANT:
# Do not brace-match this function because destructured props contain `{ pulse = {} }`.
# That is what caused the old script to stop too early and leave `}) {`.
candidate_markers = [
    "\nfunction OverviewSignalCard",
    "\nfunction MomentumCard",
    "\nfunction PriorityStack",
    "\nfunction SprintCard",
    "\nfunction ForesightCard",
    "\nfunction LiveActivityCard",
    "\n// ═══════════════════════════════════════════════════════════════════════════════\n// OVERVIEW HELPERS",
]

positions = []
for marker in candidate_markers:
    pos = text.find(marker, start + 1)
    if pos != -1:
        positions.append(pos)

if not positions:
    raise SystemExit(
        "❌ Could not find the next function after OverviewPulseCard.\n"
        "Run:\n"
        "rg -n \"function OverviewPulseCard|function OverviewSignalCard|function MomentumCard|function PriorityStack|OVERVIEW HELPERS\" src/pages/ProjectHome.jsx -C 8"
    )

end = min(positions)

new_card = r'''function OverviewPulseCard({ pulse = {} }) {
  const today = Math.max(
    0,
    Number(
      pulse?.todayCompleted ??
        pulse?.today ??
        pulse?.completedToday ??
        pulse?.shipsToday ??
        0
    ) || 0
  );

  const inMotion = Math.max(
    0,
    Number(pulse?.inMotion ?? pulse?.active ?? pulse?.inProgress ?? 0) || 0
  );

  const blocked = Math.max(
    0,
    Number(pulse?.blocked ?? pulse?.blockedCount ?? pulse?.blockers ?? 0) || 0
  );

  const ready = Math.max(
    0,
    Number(pulse?.ready ?? pulse?.readyCount ?? pulse?.readyTasks ?? 0) || 0
  );

  const totalSignals = today + inMotion + blocked + ready;

  const pulseState =
    blocked > 0
      ? "Blockers active"
      : inMotion > 0
        ? "Work moving"
        : ready > 0
          ? "Ready to ship"
          : today > 0
            ? "Shipped today"
            : "Quiet";

  const pulseMessage =
    blocked > 0
      ? "Execution has friction. Clear blockers before opening more work."
      : inMotion > 0
        ? "Work is currently moving. Keep the next handoff visible."
        : ready > 0
          ? "A task is ready. Push it forward to create momentum."
          : today > 0
            ? "Shipping happened today. Keep the project warm."
            : "No active execution signal yet. Start one clear move.";

  const signalCards = [
    {
      label: "Today",
      value: today,
      icon: Flame,
      tone: "text-orange-500",
      glow: "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20",
      bar: "from-orange-400 to-amber-300",
    },
    {
      label: "In motion",
      value: inMotion,
      icon: Zap,
      tone: "text-violet-500",
      glow: "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
      bar: "from-violet-500 to-fuchsia-400",
    },
    {
      label: "Blocked",
      value: blocked,
      icon: AlertTriangle,
      tone: blocked > 0 ? "text-rose-500" : "text-slate-400",
      glow:
        blocked > 0
          ? "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
          : "bg-slate-50 border-slate-200 dark:bg-white/[0.035] dark:border-white/[0.07]",
      bar: blocked > 0 ? "from-rose-500 to-orange-400" : "from-slate-300 to-slate-200",
    },
    {
      label: "Ready",
      value: ready,
      icon: Play,
      tone: "text-emerald-500",
      glow: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
      bar: "from-emerald-500 to-cyan-400",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(20,184,166,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            <Activity className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pulse
              </h3>
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                Live Signals
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Unified snapshot of execution signals.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Live
          </span>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            {totalSignals} signals
          </p>
        </div>
      </header>

      <div className="relative z-10 mb-5 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Current Readout
            </p>
            <h4 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
              {pulseState}
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {pulseMessage}
            </p>
          </div>

          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 sm:flex">
            <RadioTower className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-3 md:grid-cols-4">
        {signalCards.map((card) => {
          const Icon = card.icon;
          const isActive = Number(card.value) > 0;

          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:shadow-none ${card.glow}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.bar} ${isActive ? "opacity-100" : "opacity-35"}`} />

              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.tone}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    {card.label}
                  </span>
                </div>

                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
                ) : null}
              </div>

              <p className="text-3xl font-black text-slate-950 dark:text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

'''

text = text[:start] + new_card + text[end:].lstrip()
path.write_text(text)

print("")
print("✅ Fixed broken Pulse card syntax.")
print("✅ Replaced the full OverviewPulseCard block instead of partial destructured props.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function OverviewPulseCard|function OverviewSignalCard|\\}\\) \\{|Live Signals|Current Readout|RadioTower" src/pages/ProjectHome.jsx -C 8')

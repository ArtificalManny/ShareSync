from pathlib import Path
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-momentum-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

needed_icons = ["TrendingUp", "TrendingDown", "GaugeCircle", "RadioTower"]

import_start = text.find("import {", 0)
lucide_marker = '} from "lucide-react";'
import_end = text.find(lucide_marker, import_start)

if import_start == -1 or import_end == -1:
    raise SystemExit("❌ Could not find lucide-react import block.")

import_block = text[import_start:import_end]

missing = [icon for icon in needed_icons if icon not in import_block]

if missing:
    insert_at = import_end
    insertion = "".join([f"  {icon},\n" for icon in missing])
    text = text[:insert_at] + insertion + text[insert_at:]
    print(f"✅ Added lucide icons: {', '.join(missing)}")
else:
    print("ℹ️ Momentum lucide icons already imported.")

start = text.find("function MomentumCard(")
if start == -1:
    raise SystemExit(
        "❌ Could not find function MomentumCard in ProjectHome.jsx.\n"
        "Run: rg -n \"function MomentumCard|MomentumCard\" src/pages/ProjectHome.jsx src/components -C 10"
    )

brace_start = text.find("{", start)
if brace_start == -1:
    raise SystemExit("❌ Found MomentumCard but could not find opening brace.")

depth = 0
end = None

for i in range(brace_start, len(text)):
    char = text[i]
    if char == "{":
        depth += 1
    elif char == "}":
        depth -= 1
        if depth == 0:
            end = i + 1
            break

if end is None:
    raise SystemExit("❌ Could not find end of MomentumCard function.")

new_card = r'''function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  const score = Math.max(0, Math.min(100, Number(momentum) || 0));
  const safeWeeklyShips = Math.max(0, Number(weeklyShips) || 0);
  const safeTrend = Number.isFinite(Number(trend)) ? Number(trend) : 0;

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const isBuilding = safeTrend > 0;
  const isCooling = safeTrend < 0;

  const statusLabel =
    score >= 75
      ? "High momentum"
      : score >= 45
        ? "Building"
        : score > 0
          ? "Warming up"
          : "Needs signal";

  const trendLabel = isBuilding
    ? `+${safeTrend}`
    : isCooling
      ? `${safeTrend}`
      : "0";

  const trendTone = isBuilding
    ? "text-emerald-600 dark:text-emerald-300"
    : isCooling
      ? "text-rose-600 dark:text-rose-300"
      : "text-slate-500 dark:text-zinc-400";

  const TrendIcon = isBuilding ? TrendingUp : isCooling ? TrendingDown : GaugeCircle;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,0.14),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(45,212,191,0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            <TrendingUp className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Momentum
              </h3>
              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                Pace Signal
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Shipping pace, trend, and execution energy.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          Live
        </span>
      </header>

      <div className="relative z-10 grid gap-5 md:grid-cols-[150px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-[132px] w-[132px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-slate-100 dark:text-white/[0.06]"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#momentumGradient)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="momentumGradient" x1="0" y1="0" x2="120" y2="120">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="55%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-950 dark:text-white">
                {score}
              </span>
              <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                Score
              </span>
            </div>
          </div>
        </div>

        <div className="grid content-center gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                Current State
              </p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300">
                {statusLabel}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {isBuilding
                ? "Momentum is rising. Keep shipping the next visible move."
                : isCooling
                  ? "Momentum is cooling. Ship one focused task to rebuild pace."
                  : "Momentum is stable. One shipped task can move this project forward."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035]">
              <div className="mb-2 flex items-center gap-2">
                <RadioTower className="h-3.5 w-3.5 text-cyan-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Weekly Ships
                </p>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {safeWeeklyShips}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035]">
              <div className="mb-2 flex items-center gap-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendTone}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Trend
                </p>
              </div>
              <p className={`text-xl font-black ${trendTone}`}>
                {trendLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}'''

text = text[:start] + new_card + text[end:]
path.write_text(text)

print("")
print("✅ MomentumCard visually polished.")
print("✅ Added larger signal ring, gradient rail, live badge, pace status, weekly ships, and trend cards.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function MomentumCard|Pace Signal|momentumGradient|Current State|Weekly Ships" src/pages/ProjectHome.jsx -C 10')

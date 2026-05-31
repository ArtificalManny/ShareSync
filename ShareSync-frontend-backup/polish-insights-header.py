from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/insights/InsightsTab.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-insights-header-{timestamp}")
shutil.copy2(path, backup)

updated = original

old_header_css = """.insights-tab-header {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.16);
            border-radius: 1.75rem;
            padding: 1.25rem 1.35rem;
            background:
              radial-gradient(circle at 8% 18%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.12), transparent 32%),
              linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.82));
            box-shadow:
              0 24px 76px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255,255,255,0.78);
            backdrop-filter: blur(18px);
          }

          .dark .insights-tab-header {
            border-color: rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 8% 18%, rgba(139, 92, 246, 0.20), transparent 34%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88));
            box-shadow:
              0 30px 96px rgba(0,0,0,0.40),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }"""

new_header_css = """.insights-tab-header {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.18);
            border-radius: 2.25rem;
            padding: 1.6rem 1.75rem;
            background:
              radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.16), transparent 34%),
              radial-gradient(circle at 55% 105%, rgba(16, 185, 129, 0.12), transparent 36%),
              linear-gradient(135deg, rgba(255,255,255,0.97), rgba(248,250,252,0.84));
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.82);
            backdrop-filter: blur(20px);
          }

          .insights-tab-header::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
          }

          .insights-tab-header::after {
            content: "";
            position: absolute;
            right: -80px;
            top: -90px;
            width: 260px;
            height: 260px;
            border-radius: 999px;
            background: rgba(139, 92, 246, 0.14);
            filter: blur(42px);
            pointer-events: none;
          }

          .dark .insights-tab-header {
            border-color: rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.12), transparent 34%),
              radial-gradient(circle at 55% 105%, rgba(16, 185, 129, 0.10), transparent 36%),
              linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88));
            box-shadow:
              0 34px 110px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }

          .insights-header-icon {
            box-shadow:
              0 18px 42px rgba(139, 92, 246, 0.18),
              inset 0 1px 0 rgba(255,255,255,0.72);
          }

          .dark .insights-header-icon {
            box-shadow:
              0 20px 54px rgba(139, 92, 246, 0.20),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }"""

if old_header_css not in updated:
    path.write_text(original)
    raise RuntimeError(
        f"Could not find the existing insights header CSS block. No changes written. Backup kept at: {backup}"
    )

updated = updated.replace(old_header_css, new_header_css)

old_order = """      {/* ✅ Weekly Momentum Report — always renders, fetches its own data */}
      <WeeklyMomentumReport projectId={projectId} embedded />

      {/* Header & Controls */}
      <div className="insights-tab-header flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Project Insights</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Velocity, cycle time, and team health.</p>
        </div>

        {/* Time Range Selector */}
        <div className="insights-range-selector flex bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-lg p-1">
          {['7d', '14d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                range === r
                  ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>"""

new_order = """      {/* Header & Controls */}
      <div className="insights-tab-header flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative z-10 flex min-w-0 items-start gap-4">
          <div className="insights-header-icon relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
            <Activity className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Project Insights
              </h2>

              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                Signals
              </span>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                Live Metrics
              </span>
            </div>

            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
              Read velocity, cycle time, completion health, and team activity from one execution signal board.
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="insights-range-selector relative z-10 flex w-fit border border-slate-200 p-1 dark:border-white/[0.08]">
          {['7d', '14d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition-colors ${
                range === r
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Weekly Momentum Report — always renders, fetches its own data */}
      <WeeklyMomentumReport projectId={projectId} embedded />"""

if old_order not in updated:
    path.write_text(original)
    raise RuntimeError(
        f"Could not find the existing Weekly Report + Project Insights header block. No changes written. Backup kept at: {backup}"
    )

updated = updated.replace(old_order, new_order)

# Safety checks
required = [
    "WeeklyMomentumReport",
    "ActivityFeed",
    "MetricCard",
    "SprintHealth",
    "TeamBalance",
    "getProjectInsights",
    "Project Insights",
    "Live Metrics",
]

for marker in required:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. Backup kept at: {backup}"
        )

if updated == original:
    raise RuntimeError(f"No changes made. Backup kept at: {backup}")

path.write_text(updated)

print("Insights header moved and polished successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Moved Project Insights above WeeklyMomentumReport")
print("- Turned Project Insights into a full visual header")
print("- Added Signals and Live Metrics pills")
print("- Kept the 7D / 14D / 30D range selector in the header")
print("")
print("Kept intact:")
print("- WeeklyMomentumReport")
print("- MetricCard")
print("- SprintHealth")
print("- TeamBalance")
print("- ActivityFeed")
print("- API calls")
print("- Files section")
print("- Announcements section")

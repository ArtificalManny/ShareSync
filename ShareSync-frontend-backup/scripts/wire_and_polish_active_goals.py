from pathlib import Path

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(".jsx.bak-before-active-goals-real-wire")
backup.write_text(text)

changed = 0

# 1) Add helper import if missing
helper_import = 'import buildProjectActiveGoals from "../utils/projectActiveGoals";\n'

if helper_import not in text:
    marker = 'import useFollow from "../hooks/useFollow";\n'
    if marker in text:
        text = text.replace(marker, marker + helper_import, 1)
        changed += 1
    else:
        raise SystemExit("❌ Could not find import area to add buildProjectActiveGoals.")

# 2) Remove unused imported ActiveGoalsCard from the shared card import
text = text.replace(
    "  TeamCapacityCard,\n  ActiveGoalsCard,\n} from \"../components/project/pulse/card\";",
    "  TeamCapacityCard,\n} from \"../components/project/pulse/card\";",
)

# 3) Insert polished local Active Goals card before OverviewView
component_marker = "\nfunction OverviewView({"

if "function ProjectActiveGoalsCard(" not in text:
    component = r'''
function ProjectActiveGoalsCard({ goals = [], loading = false, onGoalClick }) {
  const items = Array.isArray(goals) ? goals.filter(Boolean) : [];

  const activeCount = items.filter((goal) => !goal.done).length;
  const blockedCount = items.filter((goal) => goal.blocked).length;

  const avgProgress =
    items.length > 0
      ? Math.round(
          items.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) /
            items.length
        )
      : 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-teal-100/80 bg-white p-5 shadow-sm dark:border-teal-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_92%_12%,rgba(124,58,237,0.09),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Active Goals
              </h3>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                Focus
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Live objectives shaping this project’s next execution moves.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          {loading ? "Syncing" : "Live"}
        </span>
      </header>

      <div className="relative z-10 mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Active
          </p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Progress
          </p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {avgProgress}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Blocked
          </p>
          <p className={`mt-1 text-xl font-black ${blockedCount > 0 ? "text-rose-500" : "text-slate-950 dark:text-white"}`}>
            {blockedCount}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((goal, index) => {
              const progress = Math.max(0, Math.min(100, Number(goal.progress || 0)));

              const tone = goal.blocked
                ? "border-rose-100 bg-rose-50/70 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                : goal.done
                  ? "border-emerald-100 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-violet-100 bg-violet-50/70 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300";

              return (
                <article
                  key={goal.id || index}
                  onClick={() => onGoalClick?.(goal.raw || goal)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300">
                          #{index + 1}
                        </span>

                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
                          {goal.status || "Active"}
                        </span>

                        {goal.source ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
                            {goal.source}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                        {goal.title}
                      </h4>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                        {goal.subtitle || "Keep this moving to protect project momentum."}
                      </p>

                      {goal.ownerName ? (
                        <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                          Owner: {goal.ownerName}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-slate-950 dark:text-white">
                        {progress}%
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Done
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
              <Target className="h-6 w-6" />
            </div>

            <h4 className="mt-4 text-sm font-black text-slate-950 dark:text-white">
              No active goals yet
            </h4>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Add a high-priority task, sprint goal, objective, or milestone. Once it exists, this panel becomes the project’s live focus board.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

'''
    text = text.replace(component_marker, "\n" + component + component_marker, 1)
    changed += 1

# 4) Add liveTasks to OverviewView signature
old_signature_piece = "  projectOnlineCount = 0,\n}) {"
new_signature_piece = "  projectOnlineCount = 0,\n  liveTasks = [],\n}) {"

if old_signature_piece in text and new_signature_piece not in text:
    text = text.replace(old_signature_piece, new_signature_piece, 1)
    changed += 1

# 5) Replace raw activeGoals derivation with live derived goals
old_active_goals_line = "  const activeGoals = Array.isArray(overview?.activeGoals) ? overview.activeGoals : [];"
new_active_goals_block = """  const rawActiveGoals = Array.isArray(overview?.activeGoals) ? overview.activeGoals : [];

  const activeGoals = useMemo(() => {
    const built = buildProjectActiveGoals({
      project,
      tasks: liveTasks,
      overview,
      priorityStack,
      foresight: overview?.foresight || metrics?.foresight,
    });

    return built.length > 0 ? built : rawActiveGoals;
  }, [
    project,
    liveTasks,
    overview,
    priorityStack,
    metrics?.foresight,
    rawActiveGoals,
  ]);"""

if old_active_goals_line in text and "const rawActiveGoals = Array.isArray(overview?.activeGoals)" not in text:
    text = text.replace(old_active_goals_line, new_active_goals_block, 1)
    changed += 1

# 6) Render the polished ProjectActiveGoalsCard instead of imported ActiveGoalsCard
old_render = """          <ActiveGoalsCard
            goals={activeGoals}
            loading={loading}
            onGoalClick={onObjectiveClick}
          />"""

new_render = """          <ProjectActiveGoalsCard
            goals={activeGoals}
            loading={loading}
            onGoalClick={onObjectiveClick}
          />"""

if old_render in text:
    text = text.replace(old_render, new_render, 1)
    changed += 1

# 7) Pass liveTasks into OverviewView
old_prop = "              projectOnlineCount={projectOnlineCount}\n            />"
new_prop = "              projectOnlineCount={projectOnlineCount}\n              liveTasks={liveTasks}\n            />"

if old_prop in text and "liveTasks={liveTasks}" not in text:
    text = text.replace(old_prop, new_prop, 1)
    changed += 1

path.write_text(text)

print("")
print(f"✅ Active Goals wired and polished. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "ProjectActiveGoalsCard|buildProjectActiveGoals|rawActiveGoals|liveTasks=\\{liveTasks\\}|ActiveGoalsCard" src/pages/ProjectHome.jsx -C 8')

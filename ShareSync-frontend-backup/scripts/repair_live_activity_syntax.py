from pathlib import Path
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(
    f".jsx.bak-before-repair-live-activity-syntax-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

start = text.find("function ProjectLiveActivityRow(")
if start == -1:
    raise SystemExit("❌ Could not find function ProjectLiveActivityRow(")

end_markers = [
    "function OverviewView(",
    "function OverviewPanel(",
    "function ProjectOverview(",
]

end = -1
for marker in end_markers:
    found = text.find(marker, start)
    if found != -1:
        end = found
        break

if end == -1:
    raise SystemExit(
        "❌ Could not find the next major function after ProjectLiveActivityRow. "
        "Run: rg -n \"function ProjectLiveActivityRow|function OverviewView|function ProjectOverview\" src/pages/ProjectHome.jsx -C 5"
    )

replacement = r'''
function ProjectLiveActivityRow({ item, index, project }) {
  const actorName = projectPulseGetActorName(item, project);
  const action = projectPulseGetActionLabel(item);
  const target = projectPulseGetTargetLabel(item, actorName);
  const status = projectPulseGetStatusLabel(item);
  const timestamp =
    item?.createdAt ||
    item?.updatedAt ||
    item?.timestamp ||
    item?.time ||
    item?.date ||
    item?.ts ||
    null;

  const statusKey = String(status || "").toLowerCase();

  const tone =
    statusKey.includes("completed") || statusKey.includes("shipped")
      ? {
          rail: "from-emerald-400 to-cyan-400",
          dot: "bg-emerald-400",
          badge:
            "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        }
      : statusKey.includes("blocked")
        ? {
            rail: "from-rose-400 to-orange-400",
            dot: "bg-rose-400",
            badge:
              "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
          }
        : {
            rail: "from-violet-400 to-cyan-400",
            dot: "bg-violet-400",
            badge:
              "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
          };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-violet-500/25">
      <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b ${tone.rail}`} />

      <div className="flex items-start gap-3 pl-2">
        <ProjectActivityActorAvatar
          activity={item}
          actorName={actorName}
          project={project}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tone.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {status}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              {projectPulseFormatTimeAgo(timestamp)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-200">
            <span className="font-black text-slate-950 dark:text-white">
              {actorName}
            </span>{" "}
            <span>{action}</span>{" "}
            <span className="font-black text-slate-950 dark:text-white">
              {target}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectLiveActivityCard({ activities = [], project = null }) {
  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const hasItems = items.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/90 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Live Activity
              </h3>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Realtime
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now
        </span>
      </header>

      <div className="relative z-10 p-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ProjectLiveActivityRow
                key={item?._id || item?.id || item?.createdAt || index}
                item={item}
                index={index}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
            No live activity yet. Ship an update, complete a task, or resolve a blocker to create the first signal.
          </div>
        )}
      </div>
    </section>
  );
}

'''

text = text[:start] + replacement + "\n" + text[end:]

path.write_text(text)

print("✅ Repaired Live Activity component block.")
print("✅ Removed the orphan ') {' syntax corruption.")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('nl -ba src/pages/ProjectHome.jsx | sed -n "2425,2495p"')
print("")
print("Then run:")
print("npm run build")

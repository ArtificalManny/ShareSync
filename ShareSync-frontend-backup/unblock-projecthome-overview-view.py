from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-overview-unblock-{stamp}")
shutil.copy2(path, backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

def has_component_decl(source, name):
    return bool(
        re.search(rf"\bfunction\s+{re.escape(name)}\s*\(", source)
        or re.search(rf"\bconst\s+{re.escape(name)}\s*=", source)
        or re.search(rf"\blet\s+{re.escape(name)}\s*=", source)
        or re.search(rf"\bvar\s+{re.escape(name)}\s*=", source)
    )

if has_component_decl(text, "OverviewView"):
    print("OverviewView already exists. No changes needed.")
    print(f"Backup kept at: {backup}")
    raise SystemExit(0)

overview_view = r'''
// Emergency compatibility view:
// Some tab/render logic still references OverviewView.
// This keeps the project page from crashing while preserving the new OpenShare direction.
function OverviewView({ project, tasks = [], activity = [], members = [], onTabChange }) {
  const completedTasks = Array.isArray(tasks)
    ? tasks.filter((task) => {
        const status = String(task?.status || task?.state || "").toLowerCase();
        return Boolean(task?.completedAt) || status === "done" || status === "completed";
      }).length
    : 0;

  const blockerCount = Array.isArray(tasks)
    ? tasks.filter((task) => {
        const status = String(task?.status || task?.state || "").toLowerCase();
        const priority = String(task?.priority || "").toLowerCase();
        return status.includes("block") || priority.includes("critical");
      }).length
    : 0;

  const activityCount = Array.isArray(activity) ? activity.length : 0;
  const memberCount = Array.isArray(members) ? members.length : 0;

  const projectName = project?.name || project?.title || "this project";

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 shadow-[0_24px_80px_rgba(124,58,237,0.12)] overflow-hidden">
        <div className="relative p-8 sm:p-10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_34%)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50/80 dark:bg-emerald-500/10 dark:border-emerald-400/30 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
                Live command
              </div>

              <h2 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                Command center for {projectName}
              </h2>

              <p className="mt-3 max-w-3xl text-sm sm:text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                OpenShare turns tasks, blockers, ownership, and shipping signals into one clear execution view.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onTabChange?.("moves")}
                className="rounded-2xl bg-violet-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_30px_rgba(124,58,237,0.32)] hover:brightness-110 transition"
              >
                Open Moves
              </button>

              <button
                type="button"
                onClick={() => onTabChange?.("proof")}
                className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-100 hover:border-violet-400 transition"
              >
                View Proof
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-violet-200/70 dark:border-violet-400/20 bg-white/80 dark:bg-white/[0.04] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Moves</p>
            <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{Array.isArray(tasks) ? tasks.length : 0}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Total tracked work</p>
          </div>

          <div className="rounded-3xl border border-emerald-200/70 dark:border-emerald-400/20 bg-white/80 dark:bg-white/[0.04] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">Shipped</p>
            <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{completedTasks}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Completed work</p>
          </div>

          <div className="rounded-3xl border border-amber-200/70 dark:border-amber-400/20 bg-white/80 dark:bg-white/[0.04] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">Friction</p>
            <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{blockerCount}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Blockers or critical items</p>
          </div>

          <div className="rounded-3xl border border-cyan-200/70 dark:border-cyan-400/20 bg-white/80 dark:bg-white/[0.04] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">Signals</p>
            <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{activityCount}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{memberCount} members connected</p>
          </div>
        </div>
      </div>
    </section>
  );
}

'''

# Insert before the main ProjectHome component/export.
markers = [
    "export default function ProjectHome",
    "function ProjectHome",
    "const ProjectHome =",
]

insert_at = -1
used_marker = None

for marker in markers:
    insert_at = text.find(marker)
    if insert_at != -1:
        used_marker = marker
        break

if insert_at == -1:
    fail("Could not find ProjectHome insertion point.")

text = text[:insert_at] + overview_view + "\n" + text[insert_at:]

if not has_component_decl(text, "OverviewView"):
    fail("OverviewView was not inserted correctly.")

path.write_text(text)

print("OverviewView emergency unblock applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Inserted before:")
print(f"- {used_marker}")
print("")
print("Changed only:")
print("- Added a working OverviewView component")
print("- Prevents ProjectHome from crashing when OverviewView is referenced")
print("- Adds a simple OpenShare-style Command Center overview")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No routes changed.")

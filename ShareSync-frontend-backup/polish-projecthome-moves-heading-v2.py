from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-moves-heading-v2-{timestamp}")
shutil.copy2(path, backup)

old = '''        case "tasks":
          return (
            <div className={pageWrap}>
              <StackPanel
                projectId={id}
                limit={10}
                milestoneIdFilter={selectedMilestoneId}
              />
            </div>
          );'''

new = '''        case "tasks":
          return (
            <div className={pageWrap}>
              <section className="relative mb-6 overflow-hidden rounded-[30px] border border-violet-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
                <div className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 -bottom-20 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                      Execution Queue
                    </div>

                    <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                      Moves
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                      The next visible work, blockers, assignments, and execution priority for this project.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-black/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                      Mode
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-800 dark:text-zinc-100">
                      Live project queue
                    </p>
                  </div>
                </div>
              </section>

              <StackPanel
                projectId={id}
                limit={10}
                milestoneIdFilter={selectedMilestoneId}
              />
            </div>
          );'''

if old not in original:
    raise RuntimeError(
        "Could not find the exact tasks/Moves render block. No changes written. "
        f"Backup kept at: {backup}"
    )

updated = original.replace(old, new, 1)

# Safety checks
required_still_present = [
    'case "files":',
    '<VaultView',
    'case "announcements":',
    '<AnnouncementsView',
]

for marker in required_still_present:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. "
            f"Backup kept at: {backup}"
        )

if updated.count("Execution Queue") != original.count("Execution Queue") + 1:
    path.write_text(original)
    raise RuntimeError(
        "Safety check failed: Moves heading was not inserted exactly once. "
        f"Original restored. Backup kept at: {backup}"
    )

path.write_text(updated)

print("Moves heading added successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added a bold Moves section heading above StackPanel")
print("- Kept the existing StackPanel logic intact")
print("- Did not touch Files")
print("- Did not touch Announcements")
print("- No backend/API changes")

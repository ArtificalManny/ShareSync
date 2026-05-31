from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-compact-moves-heading-{timestamp}")
shutil.copy2(path, backup)

replacements = [
    (
        'className="relative mb-6 overflow-hidden rounded-[30px] border border-violet-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none"',
        'className="relative mb-4 overflow-hidden rounded-[24px] border border-violet-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none"',
    ),
    (
        'className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl"',
        'className="pointer-events-none absolute -left-14 -top-16 h-32 w-32 rounded-full bg-violet-400/12 blur-3xl"',
    ),
    (
        'className="pointer-events-none absolute -right-16 -bottom-20 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl"',
        'className="pointer-events-none absolute -right-14 -bottom-16 h-32 w-32 rounded-full bg-cyan-400/12 blur-3xl"',
    ),
    (
        'className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"',
        'className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"',
    ),
    (
        'className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl"',
        'className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl"',
    ),
    (
        'className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400"',
        'className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 dark:text-zinc-400"',
    ),
    (
        'className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-black/20"',
        'className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-black/20"',
    ),
    (
        'className="mt-1 text-sm font-black text-slate-800 dark:text-zinc-100"',
        'className="mt-0.5 text-xs font-black text-slate-800 dark:text-zinc-100"',
    ),
]

updated = original
changed = 0

for old, new in replacements:
    if old in updated:
        updated = updated.replace(old, new, 1)
        changed += 1
    else:
        print(f"Warning: pattern not found, skipped:\n{old}\n")

if changed == 0:
    raise RuntimeError(
        "Could not find the Moves heading styles. No changes written. "
        f"Backup kept at: {backup}"
    )

# Safety checks: keep these untouched.
for marker in ['case "files":', '<VaultView', 'case "announcements":', '<AnnouncementsView']:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. "
            f"Backup kept at: {backup}"
        )

path.write_text(updated)

print("Moves heading compacted successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print(f"Style replacements applied: {changed}")
print("")
print("Changed only:")
print("- Reduced Moves heading padding")
print("- Reduced title size")
print("- Reduced glow size")
print("- Reduced caption and mode card size")
print("")
print("Kept intact:")
print("- StackPanel")
print("- Files")
print("- Announcements")
print("- Backend/API logic")

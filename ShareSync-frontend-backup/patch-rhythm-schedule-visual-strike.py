from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/RhythmView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-schedule-visual-strike-{timestamp}"
)
backup_path.write_text(original)

updated = original


def find_opening_tag_end(text, start_index):
    quote = None
    brace_depth = 0
    i = start_index

    while i < len(text):
        ch = text[i]
        prev = text[i - 1] if i > 0 else ""

        if quote:
            if ch == quote and prev != "\\":
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                brace_depth += 1
            elif ch == "}":
                brace_depth = max(0, brace_depth - 1)
            elif ch == ">" and brace_depth == 0:
                return i

        i += 1

    raise RuntimeError("Could not find the end of the JSX opening tag.")


def replace_once(text, old, new, label):
    if new in text:
        print(f"Already patched: {label}")
        return text

    if old not in text:
        raise RuntimeError(f"Could not find target for: {label}")

    return text.replace(old, new, 1)


if "export default function RhythmView" not in updated:
    raise RuntimeError("This does not look like RhythmView.jsx. No changes were written.")

# 1. Add scoped root class.
updated = replace_once(
    updated,
    '<section className="relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">',
    '<section className="rhythm-command-map relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">',
    "RhythmView root class",
)

# 2. Insert scoped CSS directly inside the RhythmView section.
style_marker = "rhythm-visual-command-style"

style_block = r'''      <style className="rhythm-visual-command-style">
        {`
          .rhythm-command-map {
            isolation: isolate;
          }

          .rhythm-command-map .rhythm-shell {
            border-color: rgba(167, 139, 250, 0.46) !important;
            background:
              radial-gradient(circle at 9% 14%, rgba(139, 92, 246, 0.17), transparent 30%),
              radial-gradient(circle at 86% 16%, rgba(34, 211, 238, 0.18), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,253,250,0.78)) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.9) !important;
          }

          .dark .rhythm-command-map .rhythm-shell {
            border-color: rgba(167, 139, 250, 0.22) !important;
            background:
              radial-gradient(circle at 10% 12%, rgba(139, 92, 246, 0.18), transparent 32%),
              radial-gradient(circle at 86% 14%, rgba(34, 211, 238, 0.14), transparent 35%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            box-shadow:
              0 32px 100px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255,255,255,0.08) !important;
          }

          .rhythm-command-map .rhythm-primary-action,
          .rhythm-command-map button.rhythm-primary-action,
          .rhythm-command-map button.rhythm-primary-action:disabled,
          .rhythm-command-map button.rhythm-primary-action[disabled] {
            background-color: #7c3aed !important;
            background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            border: 1px solid rgba(221, 214, 254, 0.92) !important;
            box-shadow:
              0 18px 42px rgba(109, 40, 217, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28) !important;
          }

          .rhythm-command-map .rhythm-primary-action *,
          .rhythm-command-map button.rhythm-primary-action * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
          }

          .rhythm-command-map .rhythm-primary-action:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background-image: linear-gradient(135deg, #9333ea 0%, #7e22ce 48%, #5b21b6 100%) !important;
            box-shadow:
              0 22px 52px rgba(109, 40, 217, 0.52),
              inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
          }

          .rhythm-command-map .rhythm-stat-card {
            position: relative;
            overflow: hidden;
            border-width: 1px !important;
            background:
              radial-gradient(circle at 12% 15%, rgba(255,255,255,0.98), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,250,252,0.82)) !important;
            box-shadow:
              0 16px 42px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.88) !important;
          }

          .dark .rhythm-command-map .rhythm-stat-card {
            background:
              radial-gradient(circle at 12% 15%, rgba(255,255,255,0.08), transparent 36%),
              linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035)) !important;
            box-shadow:
              0 18px 50px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255,255,255,0.08) !important;
          }

          .rhythm-command-map .rhythm-stat-card::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #34d399);
            opacity: 0.95;
          }

          .rhythm-command-map .rhythm-energy-chip,
          .rhythm-command-map .rhythm-realtime-chip {
            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.07),
              inset 0 1px 0 rgba(255,255,255,0.86) !important;
          }

          .rhythm-command-map .rhythm-calendar-grid {
            border-color: rgba(148, 163, 184, 0.38) !important;
            background:
              linear-gradient(135deg, rgba(255,255,255,0.94), rgba(241,245,249,0.82)) !important;
            box-shadow:
              0 22px 68px rgba(15, 23, 42, 0.11),
              inset 0 1px 0 rgba(255,255,255,0.9) !important;
          }

          .dark .rhythm-command-map .rhythm-calendar-grid {
            background:
              linear-gradient(135deg, rgba(15,23,42,0.92), rgba(2,6,23,0.88)) !important;
            border-color: rgba(255,255,255,0.10) !important;
          }

          .rhythm-command-map .rhythm-day-header {
            box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.28);
          }

          .rhythm-command-map .rhythm-time-cell {
            background-image:
              linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px),
              linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px);
            background-size: 44px 44px;
          }

          .rhythm-command-map .rhythm-time-cell:hover {
            background-color: rgba(139, 92, 246, 0.075) !important;
          }

          .rhythm-command-map .rhythm-calendar-event {
            box-shadow:
              0 16px 36px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255,255,255,0.70) !important;
          }

          .rhythm-command-map .rhythm-empty-state {
            border-color: rgba(167, 139, 250, 0.48) !important;
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,250,0.72)) !important;
            box-shadow:
              0 18px 54px rgba(15, 23, 42, 0.09),
              inset 0 1px 0 rgba(255,255,255,0.90) !important;
          }

          .dark .rhythm-command-map .rhythm-empty-state {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.18), transparent 38%),
              linear-gradient(135deg, rgba(15,23,42,0.88), rgba(2,6,23,0.82)) !important;
          }
        `}
      </style>'''

if style_marker not in updated:
    root_index = updated.find('<section className="rhythm-command-map')
    if root_index == -1:
        raise RuntimeError("Could not find patched RhythmView root section.")

    root_end = find_opening_tag_end(updated, root_index)
    updated = updated[:root_end + 1] + "\n" + style_block + updated[root_end + 1:]
else:
    print("Already patched: scoped rhythm visual CSS")

# 3. Add visual hook to outer shell.
updated = replace_once(
    updated,
    '<div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
    '<div className="rhythm-shell relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
    "Schedule shell visual hook",
)

# 4. Force primary Schedule buttons to stay visible.
updated = replace_once(
    updated,
    'className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"',
    'className="rhythm-primary-action inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"',
    "Top Schedule Session button",
)

updated = replace_once(
    updated,
    'className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"',
    'className="rhythm-primary-action mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"',
    "Empty-state Schedule Your First Session button",
)

# 5. Add visual hooks to metric cards.
updated = replace_once(
    updated,
    '<div className="rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">',
    '<div className="rhythm-stat-card rhythm-stat-violet rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">',
    "Sessions metric card",
)

updated = replace_once(
    updated,
    '<div className="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">',
    '<div className="rhythm-stat-card rhythm-stat-cyan rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">',
    "Scheduled Hours metric card",
)

updated = replace_once(
    updated,
    '<div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">',
    '<div className="rhythm-stat-card rhythm-stat-emerald rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">',
    "Focus Blocks metric card",
)

updated = replace_once(
    updated,
    '<div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">',
    '<div className="rhythm-stat-card rhythm-stat-slate rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">',
    "Open Slots metric card",
)

# 6. Add visual hooks to chips and calendar.
updated = replace_once(
    updated,
    'className={`inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-2 text-xs font-black shadow-sm backdrop-blur-xl dark:bg-white/[0.05] ${zone.ring}`}',
    'className={`rhythm-energy-chip inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-2 text-xs font-black shadow-sm backdrop-blur-xl dark:bg-white/[0.05] ${zone.ring}`}',
    "Energy legend chips",
)

updated = replace_once(
    updated,
    '<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">',
    '<div className="rhythm-realtime-chip inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">',
    "Realtime rhythm chip",
)

updated = replace_once(
    updated,
    '<div className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30">',
    '<div className="rhythm-calendar-grid mt-7 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30">',
    "Calendar grid visual hook",
)

# 7. Add hooks inside helper components.
updated = replace_once(
    updated,
    "absolute left-2 right-2 overflow-hidden rounded-2xl border px-3 py-2.5",
    "rhythm-calendar-event absolute left-2 right-2 overflow-hidden rounded-2xl border px-3 py-2.5",
    "Calendar event visual hook",
)

updated = replace_once(
    updated,
    '<div className="min-w-[170px] flex-1 border-r border-slate-200/70 last:border-r-0 dark:border-white/[0.06]">',
    '<div className="rhythm-day-column min-w-[170px] flex-1 border-r border-slate-200/70 last:border-r-0 dark:border-white/[0.06]">',
    "Day column visual hook",
)

updated = replace_once(
    updated,
    "sticky top-0 z-[8] border-b px-3 py-4 backdrop-blur-xl",
    "rhythm-day-header sticky top-0 z-[8] border-b px-3 py-4 backdrop-blur-xl",
    "Day header visual hook",
)

updated = replace_once(
    updated,
    "group relative h-16 cursor-pointer border-b border-slate-100 transition-all",
    "rhythm-time-cell group relative h-16 cursor-pointer border-b border-slate-100 transition-all",
    "Time slot visual hook",
)

updated = replace_once(
    updated,
    'className="w-28 flex-shrink-0 border-r border-slate-200/80 bg-slate-50/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#111116]/90"',
    'className="rhythm-energy-sidebar w-28 flex-shrink-0 border-r border-slate-200/80 bg-slate-50/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#111116]/90"',
    "Energy sidebar visual hook",
)

# 8. Empty state visual hook.
updated = replace_once(
    updated,
    '<div className="mt-6 overflow-hidden rounded-[2rem] border border-dashed border-violet-200 bg-white/75 p-10 text-center shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/[0.04]">',
    '<div className="rhythm-empty-state mt-6 overflow-hidden rounded-[2rem] border border-dashed border-violet-200 bg-white/75 p-10 text-center shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/[0.04]">',
    "Empty state visual hook",
)

# Safety checks.
bad_patterns = [
    "onClick={() = className=",
    "className={`rhythm-energy-chip",
]

# The second pattern is allowed only as a className template, not corruption.
for bad in bad_patterns[:1]:
    if bad in updated:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

FILE_PATH.write_text(updated)

print("Schedule visual strike patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside RhythmView.jsx")
print("- Visual class hooks on Schedule shell, KPI cards, energy chips, calendar grid, day cells, event cards, empty state, and primary buttons")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No session creation, week navigation, modal state, selected slot behavior, loading behavior, or calendar data mapping was changed.")

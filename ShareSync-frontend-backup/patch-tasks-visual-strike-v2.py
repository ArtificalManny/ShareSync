from pathlib import Path
from datetime import datetime

STACK_PANEL = Path("src/features/stack/StackPanel.jsx")
STACK_ROW = Path("src/features/stack/StackTaskRow.jsx")

for path in [STACK_PANEL, STACK_ROW]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

panel_original = STACK_PANEL.read_text()
row_original = STACK_ROW.read_text()

panel_backup = STACK_PANEL.with_suffix(STACK_PANEL.suffix + f".backup-tasks-visual-strike-v2-{timestamp}")
row_backup = STACK_ROW.with_suffix(STACK_ROW.suffix + f".backup-tasks-visual-strike-v2-{timestamp}")

panel_backup.write_text(panel_original)
row_backup.write_text(row_original)

panel_updated = panel_original
row_updated = row_original


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            "No changes were written."
        )
    return text.replace(old, new, 1)


# ─────────────────────────────────────────────────────────────────────────────
# StackPanel.jsx visual-only scoped CSS + visual hooks
# ─────────────────────────────────────────────────────────────────────────────

if "stack-command-panel" in panel_updated or "stack-command-style" in panel_updated:
    raise RuntimeError(
        "StackPanel.jsx already appears to contain the tasks visual strike classes. "
        "No changes were written."
    )

panel_css = '''    <>
      <style className="stack-command-style">
        {`
          .stack-command-panel {
            isolation: isolate;
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 84% 4%, rgba(34, 211, 238, 0.14), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.86)) !important;
            border-color: rgba(124, 58, 237, 0.22) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .stack-command-panel {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 84% 4%, rgba(34, 211, 238, 0.13), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.92)) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow:
              0 30px 100px rgba(0, 0, 0, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .stack-command-rail {
            height: 5px !important;
            background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 42%, #34d399 100%) !important;
            box-shadow:
              0 0 22px rgba(139, 92, 246, 0.42),
              0 0 26px rgba(34, 211, 238, 0.30);
          }

          .stack-command-header {
            border-radius: 24px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.58);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.70);
          }

          .dark .stack-command-header {
            background: rgba(15, 23, 42, 0.40);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-command-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.92), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(34, 211, 238, 0.12)) !important;
            box-shadow:
              0 16px 34px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .dark .stack-command-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 16px 38px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .stack-command-title {
            letter-spacing: -0.02em;
          }

          .stack-primary-button,
          .stack-composer-add-button,
          .stack-first-task-button {
            color: #ffffff !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            border: 1px solid rgba(221, 214, 254, 0.78) !important;
            box-shadow:
              0 16px 34px rgba(109, 40, 217, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
          }

          .stack-primary-button:hover,
          .stack-composer-add-button:hover,
          .stack-first-task-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .stack-primary-button svg,
          .stack-composer-add-button svg,
          .stack-first-task-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          .stack-refresh-button {
            background: rgba(255, 255, 255, 0.82) !important;
            border: 1px solid rgba(148, 163, 184, 0.30) !important;
            box-shadow:
              0 12px 26px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .dark .stack-refresh-button {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 14px 30px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .stack-signal-card {
            position: relative;
            overflow: hidden;
            min-height: 94px;
            backdrop-filter: blur(18px);
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .stack-signal-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 62%);
            opacity: 0.85;
          }

          .dark .stack-signal-card {
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .dark .stack-signal-card::before {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 62%);
            opacity: 1;
          }

          .stack-signal-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 20px 46px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76);
          }

          .dark .stack-signal-card:hover {
            box-shadow:
              0 22px 52px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .stack-signal-card > * {
            position: relative;
            z-index: 1;
          }

          .stack-signal-ready {
            border-top: 3px solid rgba(139, 92, 246, 0.82) !important;
          }

          .stack-signal-blocking {
            border-top: 3px solid rgba(245, 158, 11, 0.82) !important;
          }

          .stack-signal-critical {
            border-top: 3px solid rgba(244, 63, 94, 0.82) !important;
          }

          .stack-signal-assigned {
            border-top: 3px solid rgba(6, 182, 212, 0.82) !important;
          }

          .stack-task-composer {
            box-shadow:
              0 18px 46px rgba(124, 58, 237, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76);
          }

          .dark .stack-task-composer {
            box-shadow:
              0 20px 50px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-task-list-shell {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.48)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.72),
              0 16px 42px rgba(15, 23, 42, 0.06);
          }

          .dark .stack-task-list-shell {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.42), rgba(2, 6, 23, 0.24)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.06),
              0 18px 46px rgba(0, 0, 0, 0.30);
          }

          .stack-task-row {
            overflow: hidden;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.08), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.90)) !important;
            box-shadow:
              0 10px 26px rgba(15, 23, 42, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
          }

          .dark .stack-task-row {
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.13), transparent 34%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.66), rgba(15, 23, 42, 0.48)) !important;
            box-shadow:
              0 12px 30px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-task-row::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(90deg, rgba(139, 92, 246, 0.10), transparent 26%);
            opacity: 0;
            transition: opacity 180ms ease;
          }

          .stack-task-row:hover {
            transform: translateY(-1px);
            border-color: rgba(139, 92, 246, 0.28) !important;
            box-shadow:
              0 16px 38px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.82);
          }

          .dark .stack-task-row:hover {
            border-color: rgba(139, 92, 246, 0.34) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .stack-task-row:hover::before {
            opacity: 1;
          }

          .stack-task-row-inner {
            position: relative;
            z-index: 1;
          }

          .stack-task-title {
            letter-spacing: -0.01em;
          }

          .stack-task-complete-button {
            padding: 2px;
            border-radius: 999px;
          }

          .stack-task-action {
            min-width: 82px;
            min-height: 38px;
            border-radius: 14px !important;
            border: 1px solid rgba(221, 214, 254, 0.70) !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.26),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              background 180ms ease;
          }

          .stack-task-action:hover {
            transform: translateY(-1px);
            box-shadow:
              0 16px 34px rgba(109, 40, 217, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          }

          .stack-start-action {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          }

          .stack-review-action {
            background: linear-gradient(135deg, #38bdf8 0%, #2563eb 52%, #1d4ed8 100%) !important;
          }

          .stack-task-action,
          .stack-task-action span,
          .stack-task-action svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>

'''


old_return = """  return (
    <section className="relative w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#141418]/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">"""

new_return = """  return (
""" + panel_css + """      <section className="stack-command-panel relative w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#141418]/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">"""

panel_updated = replace_once(panel_updated, old_return, new_return, "StackPanel return shell")

panel_updated = replace_once(
    panel_updated,
    """      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />""",
    """      <div className="stack-command-rail absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />""",
    "top gradient rail",
)

panel_updated = replace_once(
    panel_updated,
    """        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">""",
    """        <div className="stack-command-header flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">""",
    "header shell",
)

panel_updated = replace_once(
    panel_updated,
    """              <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center shadow-sm">""",
    """              <div className="stack-command-icon h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center shadow-sm">""",
    "header icon shell",
)

panel_updated = replace_once(
    panel_updated,
    """                <h2 className="text-base font-bold text-slate-950 dark:text-white">""",
    """                <h2 className="stack-command-title text-base font-black text-slate-950 dark:text-white">""",
    "title weight",
)

panel_updated = replace_once(
    panel_updated,
    """                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/30 active:translate-y-0" """.rstrip(),
    """                className="stack-primary-button inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/30 active:translate-y-0" """.rstrip(),
    "main Add Task button",
)

panel_updated = replace_once(
    panel_updated,
    """              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-white/70 transition-all hover:bg-slate-200 dark:hover:bg-white/15 disabled:opacity-50" """.rstrip(),
    """              className="stack-refresh-button inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white/80 transition-all hover:-translate-y-0.5 hover:bg-slate-200 dark:hover:bg-white/15 disabled:translate-y-0 disabled:opacity-50" """.rstrip(),
    "Refresh button",
)

panel_updated = replace_once(
    panel_updated,
    """          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-4">""",
    """          <div className="stack-signal-card stack-signal-ready rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-4">""",
    "Ready signal card",
)

panel_updated = replace_once(
    panel_updated,
    """          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-500/10 p-4">""",
    """          <div className="stack-signal-card stack-signal-blocking rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-500/10 p-4">""",
    "Blocking signal card",
)

panel_updated = replace_once(
    panel_updated,
    """          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/60 dark:bg-rose-500/10 p-4">""",
    """          <div className="stack-signal-card stack-signal-critical rounded-2xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/60 dark:bg-rose-500/10 p-4">""",
    "Critical signal card",
)

panel_updated = replace_once(
    panel_updated,
    """          <div className="rounded-2xl border border-cyan-200/80 dark:border-cyan-400/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-4">""",
    """          <div className="stack-signal-card stack-signal-assigned rounded-2xl border border-cyan-200/80 dark:border-cyan-400/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-4">""",
    "Assigned signal card",
)

panel_updated = replace_once(
    panel_updated,
    """          <div className="mt-5 rounded-3xl border border-violet-200 dark:border-violet-400/20 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-cyan-500/10 p-4 shadow-inner">""",
    """          <div className="stack-task-composer mt-5 rounded-3xl border border-violet-200 dark:border-violet-400/20 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-cyan-500/10 p-4 shadow-inner">""",
    "Add task composer shell",
)

panel_updated = replace_once(
    panel_updated,
    """                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 disabled:translate-y-0 disabled:opacity-40 disabled:hover:bg-violet-600" """.rstrip(),
    """                className="stack-composer-add-button inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 disabled:translate-y-0 disabled:opacity-40 disabled:hover:bg-violet-600" """.rstrip(),
    "composer Add Task button",
)

panel_updated = replace_once(
    panel_updated,
    """        <div className="mt-5 min-h-[140px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-black/10 p-3 sm:p-4">""",
    """        <div className="stack-task-list-shell mt-5 min-h-[140px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-black/10 p-3 sm:p-4">""",
    "task list shell",
)

panel_updated = replace_once(
    panel_updated,
    """                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all group-hover:-translate-y-0.5 group-hover:bg-violet-700 active:translate-y-0" """.rstrip(),
    """                  className="stack-first-task-button inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all group-hover:-translate-y-0.5 group-hover:bg-violet-700 active:translate-y-0" """.rstrip(),
    "empty state Add Your First Task button",
)

panel_end = """    </section>
  );"""
if panel_end not in panel_updated:
    raise RuntimeError("Could not find StackPanel closing section. No changes were written.")

panel_updated = panel_updated.replace(
    panel_end,
    """      </section>
    </>
  );""",
    1,
)


# ─────────────────────────────────────────────────────────────────────────────
# StackTaskRow.jsx visual-only hooks
# ─────────────────────────────────────────────────────────────────────────────

if "stack-task-row" in row_updated:
    raise RuntimeError(
        "StackTaskRow.jsx already appears to contain the tasks visual strike classes. "
        "No changes were written."
    )

row_updated = replace_once(
    row_updated,
    '''        classes:
          "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",''',
    '''        classes:
          "stack-review-action bg-blue-600 hover:bg-blue-700 text-white shadow-sm",''',
    "Review action class",
)

row_updated = replace_once(
    row_updated,
    '''        classes:
          "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",''',
    '''        classes:
          "stack-start-action bg-violet-600 hover:bg-violet-700 text-white shadow-sm",''',
    "Start action class",
)

row_updated = replace_once(
    row_updated,
    '''      className={`group relative rounded-xl border-l-[3px] border border-slate-200 dark:border-white/10''',
    '''      className={`stack-task-row group relative rounded-xl border-l-[3px] border border-slate-200 dark:border-white/10''',
    "task row outer class",
)

row_updated = replace_once(
    row_updated,
    '''      <div className="p-3">''',
    '''      <div className="stack-task-row-inner p-3">''',
    "task row inner class",
)

row_updated = replace_once(
    row_updated,
    '''            className={`mt-0.5 flex-shrink-0 rounded-full transition-colors''',
    '''            className={`stack-task-complete-button mt-0.5 flex-shrink-0 rounded-full transition-colors''',
    "completion checkbox class",
)

row_updated = replace_once(
    row_updated,
    '''                  <div className="font-medium text-sm text-slate-800 dark:text-white truncate">''',
    '''                  <div className="stack-task-title font-bold text-sm text-slate-900 dark:text-white truncate">''',
    "task title class",
)

row_updated = replace_once(
    row_updated,
    '''                  className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg
                    disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}`}''',
    '''                  className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg
                    disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}`}''',
    "primary action button class",
)

STACK_PANEL.write_text(panel_updated)
STACK_ROW.write_text(row_updated)

print("Tasks visual strike v2 patch applied successfully.")
print(f"Updated file: {STACK_PANEL}")
print(f"Backup file:  {panel_backup}")
print(f"Updated file: {STACK_ROW}")
print(f"Backup file:  {row_backup}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside StackPanel.jsx")
print("- Visual class hooks on Tasks panel, signal cards, buttons, composer, and task list shell")
print("- Visual class hooks on StackTaskRow.jsx rows, title, checkbox, and Start/Review buttons")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No task fetching, task creation, task movement, task completion, or realtime logic was changed.")

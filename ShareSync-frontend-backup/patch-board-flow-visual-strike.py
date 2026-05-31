from pathlib import Path
from datetime import datetime

FLOW_BOARD = Path("src/features/flow/FlowBoard.jsx")
FLOW_COLUMN = Path("src/features/flow/FlowColumn.jsx")
FLOW_CARD = Path("src/features/flow/FlowTaskCard.jsx")

for path in [FLOW_BOARD, FLOW_COLUMN, FLOW_CARD]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

board_original = FLOW_BOARD.read_text()
column_original = FLOW_COLUMN.read_text()
card_original = FLOW_CARD.read_text()

board_backup = FLOW_BOARD.with_suffix(FLOW_BOARD.suffix + f".backup-board-visual-strike-{timestamp}")
column_backup = FLOW_COLUMN.with_suffix(FLOW_COLUMN.suffix + f".backup-board-visual-strike-{timestamp}")
card_backup = FLOW_CARD.with_suffix(FLOW_CARD.suffix + f".backup-board-visual-strike-{timestamp}")

board_backup.write_text(board_original)
column_backup.write_text(column_original)
card_backup.write_text(card_original)

board_updated = board_original
column_updated = column_original
card_updated = card_original


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            "No changes were written."
        )
    return text.replace(old, new, 1)


# ─────────────────────────────────────────────────────────────────────────────
# FlowBoard.jsx — scoped CSS + visual hooks
# ─────────────────────────────────────────────────────────────────────────────

if "flow-board-visual-style" in board_updated:
    raise RuntimeError("FlowBoard.jsx already appears patched. No changes were written.")

flow_style = r'''      <style className="flow-board-visual-style">
        {`
          .flow-board-shell {
            isolation: isolate;
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.15), transparent 32%),
              radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.12), transparent 28%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.84)) !important;
            border-color: rgba(124, 58, 237, 0.22) !important;
            box-shadow:
              0 28px 92px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .flow-board-shell {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.13), transparent 32%),
              radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.10), transparent 28%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92)) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow:
              0 30px 105px rgba(0, 0, 0, 0.50),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .flow-board-rail {
            height: 5px !important;
            background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 44%, #34d399 100%) !important;
            box-shadow:
              0 0 24px rgba(139, 92, 246, 0.42),
              0 0 28px rgba(34, 211, 238, 0.30);
          }

          .flow-board-header {
            border-radius: 26px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.62);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .flow-board-header {
            background: rgba(15, 23, 42, 0.42);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-board-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.92), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.20), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 18px 36px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
          }

          .dark .flow-board-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 18px 40px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .flow-live-pill,
          .flow-refresh-button {
            backdrop-filter: blur(18px);
            background: rgba(255, 255, 255, 0.84) !important;
            border-color: rgba(148, 163, 184, 0.28) !important;
            box-shadow:
              0 12px 26px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .dark .flow-live-pill,
          .dark .flow-refresh-button {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 14px 30px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .flow-refresh-button:hover {
            color: #6d28d9 !important;
            border-color: rgba(139, 92, 246, 0.34) !important;
            box-shadow:
              0 18px 38px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
          }

          .flow-stat-card {
            position: relative;
            overflow: hidden;
            min-height: 96px;
            backdrop-filter: blur(18px);
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .flow-stat-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 62%);
            opacity: 0.90;
          }

          .dark .flow-stat-card {
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .dark .flow-stat-card::before {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 62%);
          }

          .flow-stat-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 20px 46px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76) !important;
          }

          .flow-stat-card > * {
            position: relative;
            z-index: 1;
          }

          .flow-stat-total { border-top: 3px solid rgba(100, 116, 139, 0.72) !important; }
          .flow-stat-motion { border-top: 3px solid rgba(139, 92, 246, 0.86) !important; }
          .flow-stat-review { border-top: 3px solid rgba(245, 158, 11, 0.86) !important; }
          .flow-stat-blocked { border-top: 3px solid rgba(244, 63, 94, 0.86) !important; }
          .flow-stat-done { border-top: 3px solid rgba(16, 185, 129, 0.86) !important; }

          .flow-stage-chip {
            box-shadow:
              0 10px 22px rgba(15, 23, 42, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.68);
            backdrop-filter: blur(14px);
          }

          .dark .flow-stage-chip {
            box-shadow:
              0 10px 24px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .flow-column-grid {
            align-items: stretch;
          }

          .flow-lane {
            position: relative;
            backdrop-filter: blur(18px);
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.64)) !important;
            box-shadow:
              0 16px 38px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .flow-lane {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.10), transparent 34%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.62), rgba(15, 23, 42, 0.46)) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-lane-backlog { border-top: 3px solid rgba(148, 163, 184, 0.78) !important; }
          .flow-lane-todo { border-top: 3px solid rgba(34, 211, 238, 0.86) !important; }
          .flow-lane-in_progress { border-top: 3px solid rgba(139, 92, 246, 0.86) !important; }
          .flow-lane-review { border-top: 3px solid rgba(245, 158, 11, 0.86) !important; }
          .flow-lane-done { border-top: 3px solid rgba(16, 185, 129, 0.86) !important; }

          .flow-lane-header {
            border-radius: 18px;
            padding: 10px 10px 9px;
            background: rgba(255, 255, 255, 0.46);
            border: 1px solid rgba(255, 255, 255, 0.56);
          }

          .dark .flow-lane-header {
            background: rgba(255, 255, 255, 0.045);
            border-color: rgba(255, 255, 255, 0.07);
          }

          .flow-lane-count {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
          }

          .flow-lane-add-button {
            background: rgba(255, 255, 255, 0.68) !important;
            border: 1px solid rgba(148, 163, 184, 0.22);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
          }

          .flow-lane-add-button:hover {
            color: #7c3aed !important;
            background: rgba(245, 243, 255, 0.92) !important;
            border-color: rgba(139, 92, 246, 0.28);
          }

          .dark .flow-lane-add-button {
            background: rgba(255, 255, 255, 0.06) !important;
            border-color: rgba(255, 255, 255, 0.08);
          }

          .flow-lane-scroll {
            scrollbar-width: thin;
          }

          .flow-lane-composer {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.12), transparent 38%),
              rgba(255, 255, 255, 0.92) !important;
            box-shadow:
              0 14px 30px rgba(124, 58, 237, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.70);
          }

          .dark .flow-lane-composer {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.15), transparent 38%),
              rgba(15, 23, 42, 0.88) !important;
            box-shadow:
              0 16px 34px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-lane-submit-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            box-shadow:
              0 10px 22px rgba(109, 40, 217, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.24);
          }

          .flow-lane-empty {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08), transparent 46%),
              rgba(255, 255, 255, 0.35) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
          }

          .dark .flow-lane-empty {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12), transparent 46%),
              rgba(255, 255, 255, 0.025) !important;
          }

          .flow-task-card {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.08), transparent 38%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.90)) !important;
            box-shadow:
              0 12px 28px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .dark .flow-task-card {
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.13), transparent 38%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.62)) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-task-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(90deg, rgba(139, 92, 246, 0.10), transparent 32%);
            opacity: 0;
            transition: opacity 180ms ease;
          }

          .flow-task-card:hover {
            transform: translateY(-2px);
            border-color: rgba(139, 92, 246, 0.30) !important;
            box-shadow:
              0 18px 40px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.82);
          }

          .dark .flow-task-card:hover {
            border-color: rgba(139, 92, 246, 0.36) !important;
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .flow-task-card:hover::before {
            opacity: 1;
          }

          .flow-task-card > * {
            position: relative;
            z-index: 1;
          }

          .flow-task-grip {
            border-radius: 10px;
            padding: 2px;
            background: rgba(148, 163, 184, 0.10);
          }

          .flow-task-title {
            letter-spacing: -0.01em;
          }

          .flow-task-priority,
          .flow-task-blocked-chip,
          .flow-task-due-chip {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
          }

          .flow-task-footer {
            border-top: 1px solid rgba(148, 163, 184, 0.14);
            padding-top: 8px;
          }

          .dark .flow-task-footer {
            border-top-color: rgba(255, 255, 255, 0.07);
          }
        `}
      </style>

'''

board_updated = replace_once(
    board_updated,
    '    <section className={`relative ${className}`} aria-label="Project board">\n',
    '    <section className={`flow-command-board relative ${className}`} aria-label="Project board">\n' + flow_style,
    "FlowBoard opening section",
)

board_updated = replace_once(
    board_updated,
    '<div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/82 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30">',
    '<div className="flow-board-shell relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/82 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30">',
    "FlowBoard shell",
)

board_updated = replace_once(
    board_updated,
    '<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />',
    '<div className="flow-board-rail absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />',
    "FlowBoard top rail",
)

board_updated = replace_once(
    board_updated,
    '<header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">',
    '<header className="flow-board-header mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">',
    "FlowBoard header",
)

board_updated = replace_once(
    board_updated,
    '<div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-cyan-500/10 dark:text-violet-300">',
    '<div className="flow-board-icon relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-cyan-500/10 dark:text-violet-300">',
    "FlowBoard icon",
)

board_updated = replace_once(
    board_updated,
    '<div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">',
    '<div className="flow-live-pill inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">',
    "Live Board pill",
)

board_updated = replace_once(
    board_updated,
    'className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-lg hover:shadow-violet-500/10 active:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"',
    'className="flow-refresh-button inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-lg hover:shadow-violet-500/10 active:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"',
    "Refresh button",
)

board_updated = replace_once(
    board_updated,
    '<div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">',
    '<div className="flow-stat-card flow-stat-total rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">',
    "Total stat card",
)

board_updated = replace_once(
    board_updated,
    '<div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">',
    '<div className="flow-stat-card flow-stat-motion rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">',
    "In Motion stat card",
)

board_updated = replace_once(
    board_updated,
    '<div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">',
    '<div className="flow-stat-card flow-stat-review rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">',
    "Review stat card",
)

board_updated = replace_once(
    board_updated,
    '<div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">',
    '<div className="flow-stat-card flow-stat-blocked rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">',
    "Blocked stat card",
)

board_updated = replace_once(
    board_updated,
    '<div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">',
    '<div className="flow-stat-card flow-stat-done rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">',
    "Done stat card",
)

board_updated = replace_once(
    board_updated,
    'className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${meta.chip}`}',
    'className={`flow-stage-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${meta.chip}`}',
    "stage status chips",
)

board_updated = replace_once(
    board_updated,
    '<div className="relative grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-5 [&>*]:min-w-0">',
    '<div className="flow-column-grid relative grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-5 [&>*]:min-w-0">',
    "Flow column grid",
)


# ─────────────────────────────────────────────────────────────────────────────
# FlowColumn.jsx — lane-level visual hooks
# ─────────────────────────────────────────────────────────────────────────────

if "flow-lane-${status}" in column_updated:
    raise RuntimeError("FlowColumn.jsx already appears patched. No changes were written.")

column_updated = replace_once(
    column_updated,
    'className={`rounded-[1.35rem] border bg-white/60 dark:bg-slate-900/40 p-2.5 flex flex-col min-h-[220px] max-h-[calc(100vh-19rem)] overflow-hidden transition-all ${',
    'className={`flow-lane flow-lane-${status} rounded-[1.35rem] border bg-white/60 dark:bg-slate-900/40 p-2.5 flex flex-col min-h-[220px] max-h-[calc(100vh-19rem)] overflow-hidden transition-all ${',
    "FlowColumn lane shell",
)

column_updated = replace_once(
    column_updated,
    '<header className="flex items-start justify-between gap-2 px-1 pb-2">',
    '<header className="flow-lane-header flex items-start justify-between gap-2 px-1 pb-2">',
    "FlowColumn header",
)

column_updated = replace_once(
    column_updated,
    '<span className="text-xs text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">',
    '<span className="flow-lane-count text-xs text-slate-500 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">',
    "FlowColumn count pill",
)

column_updated = replace_once(
    column_updated,
    'className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"',
    'className="flow-lane-add-button p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"',
    "FlowColumn lane add button",
)

column_updated = replace_once(
    column_updated,
    '<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">',
    '<div className="flow-lane-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">',
    "FlowColumn scroll area",
)

column_updated = replace_once(
    column_updated,
    'className="rounded-xl border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-[#111113] p-2.5 shadow-sm"',
    'className="flow-lane-composer rounded-xl border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-[#111113] p-2.5 shadow-sm"',
    "FlowColumn inline composer",
)

column_updated = replace_once(
    column_updated,
    'className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"',
    'className="flow-lane-submit-button px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-black hover:bg-violet-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"',
    "FlowColumn add submit button",
)

column_updated = replace_once(
    column_updated,
    'className="w-full mt-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 p-3 text-center transition-colors group"',
    'className="flow-lane-empty w-full mt-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 p-3 text-center transition-colors group"',
    "FlowColumn empty state",
)


# ─────────────────────────────────────────────────────────────────────────────
# FlowTaskCard.jsx — task-card visual hooks
# ─────────────────────────────────────────────────────────────────────────────

if "flow-task-card" in card_updated:
    raise RuntimeError("FlowTaskCard.jsx already appears patched. No changes were written.")

card_updated = replace_once(
    card_updated,
    '        group rounded-[1rem] border border-slate-200/70 dark:border-slate-800',
    '        flow-task-card group rounded-[1rem] border border-slate-200/70 dark:border-slate-800',
    "FlowTaskCard shell",
)

card_updated = replace_once(
    card_updated,
    'className="mt-0.5 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors"',
    'className="flow-task-grip mt-0.5 text-slate-300 dark:text-slate-500 group-hover:text-violet-400 transition-colors"',
    "FlowTaskCard grip",
)

card_updated = replace_once(
    card_updated,
    'className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug"',
    'className="flow-task-title text-[13px] font-black text-slate-950 dark:text-slate-100 break-words leading-snug"',
    "FlowTaskCard title",
)

card_updated = replace_once(
    card_updated,
    'className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priority.className}`}',
    'className={`flow-task-priority text-[10px] px-2 py-0.5 rounded-full border font-black ${priority.className}`}',
    "FlowTaskCard priority pill",
)

card_updated = replace_once(
    card_updated,
    '''className="
                inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md
                bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300
                border border-amber-200 dark:border-yellow-500/20
              "''',
    '''className="
                flow-task-blocked-chip inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md
                bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300
                border border-amber-200 dark:border-yellow-500/20
              "''',
    "FlowTaskCard blocked chip",
)

card_updated = replace_once(
    card_updated,
    'className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${dueMeta.className}`}',
    'className={`flow-task-due-chip inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${dueMeta.className}`}',
    "FlowTaskCard due chip",
)

card_updated = replace_once(
    card_updated,
    'className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400"',
    'className="flow-task-footer mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400"',
    "FlowTaskCard footer",
)


FLOW_BOARD.write_text(board_updated)
FLOW_COLUMN.write_text(column_updated)
FLOW_CARD.write_text(card_updated)

print("Board / Flow visual strike patch applied successfully.")
print(f"Updated file: {FLOW_BOARD}")
print(f"Backup file:  {board_backup}")
print(f"Updated file: {FLOW_COLUMN}")
print(f"Backup file:  {column_backup}")
print(f"Updated file: {FLOW_CARD}")
print(f"Backup file:  {card_backup}")
print("")
print("Changed only:")
print("- Board visual shell, header, rail, stats, Live Board pill, and Refresh button")
print("- Board lane visual classes, lane headers, lane add buttons, inline composer, and empty states")
print("- Board task card visual classes, drag grip, priority chip, blocked/due chips, and footer")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No task loading, moving, drag/drop payloads, add-task behavior, filtering, or realtime logic was changed.")

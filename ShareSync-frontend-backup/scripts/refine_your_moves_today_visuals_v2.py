from pathlib import Path
from datetime import datetime

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-daily-focus-visual-refine-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

required_markers = [
    "function DailyFocusIntroPanel({",
    "function DailyFocusMoveControls({",
    "function EmptyState({ onRefresh })",
    "export function YourMovesWidget",
    "export function FocusBanner",
]

for marker in required_markers:
    if marker not in text:
        raise SystemExit(f"❌ Missing expected marker `{marker}`. No changes written.")

if text.count("function DailyFocusIntroPanel({") != 1:
    raise SystemExit("❌ Safety check failed: expected exactly one DailyFocusIntroPanel. No changes written.")

if text.count("function DailyFocusMoveControls({") != 1:
    raise SystemExit("❌ Safety check failed: expected exactly one DailyFocusMoveControls. No changes written.")

if text.count("function EmptyState({ onRefresh })") != 1:
    raise SystemExit("❌ Safety check failed: expected exactly one EmptyState. No changes written.")

if text.count("export function YourMovesWidget") != 1:
    raise SystemExit("❌ Safety check failed: expected exactly one YourMovesWidget export. No changes written.")

if text.count("export function FocusBanner") != 1:
    raise SystemExit("❌ Safety check failed: expected exactly one FocusBanner export. No changes written.")


def replace_between(source, start_marker, end_marker, replacement):
    start = source.find(start_marker)
    if start == -1:
        raise SystemExit(f"❌ Could not find start marker `{start_marker}`. No changes written.")

    end = source.find(end_marker, start)
    if end == -1:
        raise SystemExit(f"❌ Could not find end marker `{end_marker}` after `{start_marker}`. No changes written.")

    return source[:start] + replacement.rstrip() + "\n\n" + source[end:]


new_intro_panel = r"""
function DailyFocusIntroPanel({
  isUsingDailyFocus,
  hasAcceptedDailyPlan,
  dailyFocusPlan,
  dailyFocusMoves,
  isPlanningAction,
  customMoveTitle,
  setCustomMoveTitle,
  onAcceptDailyFocus,
  onAddCustomMove,
}) {
  const totalMoves = Array.isArray(dailyFocusMoves) ? dailyFocusMoves.length : 0;
  const completedMoves = dailyFocusMoves.filter((move) => {
    const status = String(move?.status || '').toLowerCase();
    return status === 'done' || status === 'completed' || status === 'complete';
  }).length;

  const progressPercent = totalMoves > 0
    ? Math.min(100, Math.round((completedMoves / totalMoves) * 100))
    : 0;

  const statusLabel = hasAcceptedDailyPlan ? 'Locked for today' : 'Ready to choose';
  const headline = hasAcceptedDailyPlan
    ? "Today's plan locked"
    : 'Recommended from your active projects';

  const body = hasAcceptedDailyPlan
    ? 'These are the moves you chose for today. Complete them to turn the day into momentum.'
    : 'OpenShare found the highest-leverage moves for this account right now. Accept them or add your own move.';

  if (!isUsingDailyFocus) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-violet-100 dark:border-violet-500/15 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/40 dark:from-violet-500/10 dark:via-zinc-950 dark:to-cyan-500/5 px-5 py-4 shadow-sm">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--theme-accent-glow)] blur-2xl opacity-70" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-950 border border-violet-100 dark:border-violet-500/20 shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-[var(--theme-accent-primary)]" />
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-accent-primary)]">
                Recommended from your active projects
              </p>

              <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600 dark:text-zinc-400">
                OpenShare found the highest-leverage moves for this account right now.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 dark:bg-zinc-950 border border-violet-100 dark:border-violet-500/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
            Daily focus
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-100 dark:border-violet-500/15 bg-gradient-to-br from-white via-violet-50/50 to-cyan-50/50 dark:from-zinc-950 dark:via-violet-500/10 dark:to-cyan-500/5 px-5 py-5 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[var(--theme-accent-primary)] via-cyan-400 to-teal-400" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--theme-accent-glow)] blur-3xl opacity-80" />
      <div className="absolute -bottom-20 left-1/3 h-32 w-32 rounded-full bg-cyan-200/30 dark:bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-950 border border-violet-100 dark:border-violet-500/20 shadow-sm">
              <Sparkles className="h-5 w-5 text-[var(--theme-accent-primary)]" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-accent-primary)]">
                  {headline}
                </p>

                <span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {statusLabel}
                </span>
              </div>

              <p className="mt-1.5 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600 dark:text-zinc-400">
                {body}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-zinc-950/60 px-3 py-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Moves
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800 dark:text-zinc-100">
                <Target className="h-4 w-4 text-[var(--theme-accent-primary)]" />
                {totalMoves}
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-zinc-950/60 px-3 py-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Plan State
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800 dark:text-zinc-100">
                <Zap className="h-4 w-4 text-[var(--theme-accent-primary)]" />
                {dailyFocusPlan?.status || 'suggested'}
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-zinc-950/60 px-3 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Completion
                </p>
                <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200">
                  {completedMoves}/{totalMoves}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--theme-accent-primary)] via-cyan-400 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[310px]">
          {!hasAcceptedDailyPlan && (
            <button
              type="button"
              onClick={onAcceptDailyFocus}
              disabled={isPlanningAction || dailyFocusMoves.length === 0}
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--theme-accent-primary)] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:-translate-y-0.5 hover:brightness-110 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Today's Moves
            </button>
          )}

          <form onSubmit={onAddCustomMove} className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-zinc-950/60 p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                value={customMoveTitle}
                onChange={(event) => setCustomMoveTitle(event.target.value)}
                placeholder="Add your own move..."
                className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm font-bold text-slate-800 placeholder:text-slate-400 dark:text-zinc-100 outline-none focus:border-[var(--theme-accent-primary)]"
              />

              <button
                type="submit"
                disabled={isPlanningAction || !customMoveTitle.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-[var(--theme-accent-primary)] transition-all disabled:opacity-40 disabled:hover:translate-y-0 dark:bg-white dark:text-zinc-950"
                title="Add custom move"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

new_controls = r"""
function DailyFocusMoveControls({
  move,
  moveId,
  isEditing,
  editingTitle,
  setEditingTitle,
  isPlanningAction,
  hasAcceptedDailyPlan,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onComplete,
}) {
  const handleEditSubmit = (event) => {
    event.preventDefault();
    onSaveEdit(moveId);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleEditSubmit}
        className="mt-3 rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-white/80 dark:bg-zinc-950/70 p-3 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold text-slate-800 dark:text-zinc-100 outline-none focus:border-[var(--theme-accent-primary)]"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPlanningAction || !editingTitle.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--theme-accent-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>

            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isPlanningAction}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onComplete(move)}
        disabled={isPlanningAction}
        className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-100 transition-all disabled:opacity-50 disabled:hover:translate-y-0 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300"
      >
        <CheckCircle2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        Complete
      </button>

      <button
        type="button"
        onClick={() => onStartEdit(move)}
        disabled={isPlanningAction}
        className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:-translate-y-0.5 hover:border-violet-200 hover:text-[var(--theme-accent-primary)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
      >
        <Pencil className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(moveId)}
        disabled={isPlanningAction}
        className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:-translate-y-0.5 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-500/30"
      >
        <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        {hasAcceptedDailyPlan ? 'Delete' : 'Dismiss'}
      </button>
    </div>
  );
}
"""

new_empty_state = r"""
function EmptyState({ onRefresh }) {
  const goToProjects = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-teal-100 dark:border-teal-500/10 bg-gradient-to-br from-teal-50/80 via-white to-violet-50/50 dark:from-teal-500/10 dark:via-zinc-950 dark:to-violet-500/5 px-6 py-12 text-center shadow-sm">
      <div className="absolute left-1/2 top-8 h-28 w-28 -translate-x-1/2 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />

      <div className="relative mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-3xl border border-white/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-950/70">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-500/20">
          <Flame className="w-7 h-7 text-teal-600 dark:text-teal-300" />
        </div>
      </div>

      <h4 className="relative text-xl font-black text-slate-900 dark:text-zinc-100">
        All caught up! 🎉
      </h4>

      <p className="relative mx-auto mt-2 mb-7 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
        No critical moves right now. Create a project or add tasks inside one of your projects to start building momentum.
      </p>

      <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--theme-accent-primary)] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:-translate-y-0.5 hover:brightness-110 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          Create Project
        </button>

        <button
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-[var(--theme-accent-primary)] hover:text-[var(--theme-accent-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <LayoutDashboard className="w-4 h-4" />
          View Projects
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-[var(--theme-accent-primary)] hover:text-[var(--theme-accent-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  );
}
"""

text = replace_between(
    text,
    "function DailyFocusIntroPanel({",
    "function DailyFocusMoveControls({",
    new_intro_panel,
)

text = replace_between(
    text,
    "function DailyFocusMoveControls({",
    "function EmptyState({ onRefresh })",
    new_controls,
)

text = replace_between(
    text,
    "function EmptyState({ onRefresh })",
    "export function YourMovesWidget",
    new_empty_state,
)

safety_checks = [
    "function DailyFocusIntroPanel({",
    "function DailyFocusMoveControls({",
    "function EmptyState({ onRefresh })",
    "export function YourMovesWidget",
    "export function FocusBanner",
    "Accept Today's Moves",
    "Today's plan locked",
    "Locked for today",
    "Completion",
    "Create Project",
]

for item in safety_checks:
    if item not in text:
        raise SystemExit(f"❌ Safety check failed after patch: missing `{item}`. No changes written.")

if text.count("function DailyFocusIntroPanel({") != 1:
    raise SystemExit("❌ Safety check failed after patch: DailyFocusIntroPanel count is not exactly 1. No changes written.")

if text.count("function DailyFocusMoveControls({") != 1:
    raise SystemExit("❌ Safety check failed after patch: DailyFocusMoveControls count is not exactly 1. No changes written.")

if text.count("function EmptyState({ onRefresh })") != 1:
    raise SystemExit("❌ Safety check failed after patch: EmptyState count is not exactly 1. No changes written.")

if text.count("export function YourMovesWidget") != 1:
    raise SystemExit("❌ Safety check failed after patch: YourMovesWidget export count is not exactly 1. No changes written.")

if text.count("export function FocusBanner") != 1:
    raise SystemExit("❌ Safety check failed after patch: FocusBanner export count is not exactly 1. No changes written.")

path.write_text(text)

print("✅ YourMovesToday.jsx visual refinement complete.")
print("✅ Replaced only DailyFocusIntroPanel, DailyFocusMoveControls, and EmptyState.")
print("✅ Backend untouched.")
print("✅ Existing exports preserved.")
print("✅ Backup saved before changes.")

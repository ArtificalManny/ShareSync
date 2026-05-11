from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("Could not find src/components/focus/YourMovesToday.jsx. No changes made.")

text = path.read_text()

backup_path = path.with_name(
    f"YourMovesToday.jsx.bak-before-visual-refine-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(text)

print(f"✅ Backup created: {backup_path}")

required_markers = [
    "export default function YourMovesToday",
    "function EmptyState",
    "export function YourMovesWidget",
    "export function FocusBanner",
    "const displayMoves = (topMoves.length > 0 ? topMoves : moves).slice(0, maxMoves);",
]

for marker in required_markers:
    if marker not in text:
        raise SystemExit(f"Missing expected marker `{marker}`. No changes made beyond backup.")

# 1) Fix the known missing brace after EmptyState, if still present.
empty_start = text.find("function EmptyState")
widget_start = text.find("export function YourMovesWidget")

if empty_start == -1 or widget_start == -1 or widget_start < empty_start:
    raise SystemExit("Could not safely locate EmptyState and YourMovesWidget. No changes made beyond backup.")

before_widget_tail = text[:widget_start].rstrip()

if before_widget_tail.endswith(");"):
    text = text[:widget_start] + "}\n\n" + text[widget_start:]
    print("✅ Added missing closing brace after EmptyState.")
elif before_widget_tail.endswith("}"):
    print("✅ EmptyState already appears to have a closing brace.")
else:
    raise SystemExit("Could not determine EmptyState ending safely. No changes made beyond backup.")

# Recalculate after possible brace insertion.
empty_start = text.find("function EmptyState")
widget_start = text.find("export function YourMovesWidget")

# 2) Upgrade lucide imports.
old_import = "import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle, FolderPlus, LayoutDashboard } from 'lucide-react';"
new_import = "import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle, FolderPlus, LayoutDashboard, Sparkles, ShieldCheck, Trophy, Clock3 } from 'lucide-react';"

if old_import in text:
    text = text.replace(old_import, new_import, 1)
    print("✅ Added visual refinement icons.")
elif new_import in text:
    print("✅ Visual refinement icons already present.")
else:
    raise SystemExit("Could not safely update lucide-react import. No changes made beyond backup.")

# 3) Add visual helper functions after toFiniteNumber.
number_helper = """function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}
"""

visual_helpers = """function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function isMoveComplete(move) {
  const status = String(move?.status || '').toLowerCase();

  return (
    status === 'done' ||
    status === 'complete' ||
    status === 'completed'
  );
}

function getFocusVisualTone({
  hasUrgentMoves = false,
  totalMoves = 0,
  completedCount = 0,
  focusStatus = '',
} = {}) {
  const normalizedStatus = String(focusStatus || '').toLowerCase();
  const allMovesComplete = totalMoves > 0 && completedCount >= totalMoves;
  const isLocked =
    normalizedStatus === 'accepted' ||
    normalizedStatus === 'locked' ||
    normalizedStatus === 'active';

  if (allMovesComplete || normalizedStatus === 'completed') {
    return {
      key: 'complete',
      label: 'Complete',
      eyebrow: 'Daily focus complete',
      briefingTitle: 'Momentum achieved',
      briefingCopy: 'You turned today’s plan into real progress. Keep the streak alive.',
      icon: Trophy,
      shell: 'border-teal-200/80 dark:border-teal-400/20 shadow-[0_18px_60px_rgba(20,184,166,0.10)]',
      iconShell: 'bg-teal-100 dark:bg-teal-500/15',
      iconText: 'text-teal-600 dark:text-teal-300',
      pill: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-400/20',
      briefing: 'border-teal-100 dark:border-teal-400/15 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 dark:from-teal-500/10 dark:via-white/[0.03] dark:to-emerald-500/5',
      cardAccent: 'before:from-teal-400 before:to-emerald-400',
      progress: 'bg-gradient-to-r from-teal-400 via-emerald-400 to-green-500',
    };
  }

  if (hasUrgentMoves) {
    return {
      key: 'urgent',
      label: 'Action needed',
      eyebrow: 'Priority briefing',
      briefingTitle: 'High-leverage work is waiting',
      briefingCopy: 'Start with the move that removes the most pressure from your day.',
      icon: AlertCircle,
      shell: 'border-amber-200/90 dark:border-amber-400/20 shadow-[0_18px_60px_rgba(245,158,11,0.10)]',
      iconShell: 'bg-amber-100 dark:bg-amber-500/15',
      iconText: 'text-amber-600 dark:text-amber-300',
      pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20',
      briefing: 'border-amber-100 dark:border-amber-400/15 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-amber-500/10 dark:via-white/[0.03] dark:to-orange-500/5',
      cardAccent: 'before:from-amber-400 before:to-orange-400',
      progress: 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400',
    };
  }

  if (isLocked) {
    return {
      key: 'locked',
      label: 'Locked',
      eyebrow: 'Today’s plan locked',
      briefingTitle: 'Your mission is set',
      briefingCopy: 'These are the moves you chose for today. Complete them to turn the day into momentum.',
      icon: ShieldCheck,
      shell: 'border-orange-200/80 dark:border-orange-400/20 shadow-[0_18px_60px_rgba(251,146,60,0.10)]',
      iconShell: 'bg-orange-100 dark:bg-orange-500/15',
      iconText: 'text-orange-600 dark:text-orange-300',
      pill: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-400/20',
      briefing: 'border-orange-100 dark:border-orange-400/15 bg-gradient-to-br from-orange-50/75 via-white to-amber-50/50 dark:from-orange-500/10 dark:via-white/[0.03] dark:to-amber-500/5',
      cardAccent: 'before:from-orange-400 before:to-amber-400',
      progress: 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400',
    };
  }

  if (totalMoves > 0) {
    return {
      key: 'suggested',
      label: 'Suggested',
      eyebrow: 'Daily focus briefing',
      briefingTitle: 'Recommended from your active projects',
      briefingCopy: 'OpenShare found the highest-leverage moves for this account right now.',
      icon: Sparkles,
      shell: 'border-violet-200/80 dark:border-violet-400/20 shadow-[0_18px_60px_rgba(139,92,246,0.10)]',
      iconShell: 'bg-violet-100 dark:bg-violet-500/15',
      iconText: 'text-[var(--theme-accent-primary)]',
      pill: 'bg-violet-50 text-[var(--theme-accent-primary)] border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-400/20',
      briefing: 'border-violet-100 dark:border-violet-400/15 bg-gradient-to-br from-violet-50/75 via-white to-cyan-50/40 dark:from-violet-500/10 dark:via-white/[0.03] dark:to-cyan-500/5',
      cardAccent: 'before:from-violet-500 before:to-cyan-400',
      progress: 'bg-gradient-to-r from-violet-500 via-cyan-400 to-teal-400',
    };
  }

  return {
    key: 'empty',
    label: 'Ready',
    eyebrow: 'Daily focus clear',
    briefingTitle: 'All caught up',
    briefingCopy: 'No critical moves right now. Create a project or add tasks to start building momentum.',
    icon: Flame,
    shell: 'border-teal-100 dark:border-teal-400/15 shadow-[0_18px_60px_rgba(20,184,166,0.08)]',
    iconShell: 'bg-teal-100 dark:bg-teal-500/15',
    iconText: 'text-teal-600 dark:text-teal-300',
    pill: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-400/20',
    briefing: 'border-teal-100 dark:border-teal-400/15 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/40 dark:from-teal-500/10 dark:via-white/[0.03] dark:to-cyan-500/5',
    cardAccent: 'before:from-teal-400 before:to-cyan-400',
    progress: 'bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-400',
  };
}
"""

if "function getFocusVisualTone" not in text:
    if number_helper not in text:
        raise SystemExit("Could not find toFiniteNumber helper block. No changes made beyond backup.")
    text = text.replace(number_helper, visual_helpers, 1)
    print("✅ Added visual tone helpers.")
else:
    print("✅ Visual tone helpers already present.")

# 4) Add derived visual state inside component.
old_display_moves = "  const displayMoves = (topMoves.length > 0 ? topMoves : moves).slice(0, maxMoves);\n"
new_display_moves = """  const displayMoves = (topMoves.length > 0 ? topMoves : moves).slice(0, maxMoves);

  const completedCount = useMemo(() => {
    return displayMoves.filter(isMoveComplete).length;
  }, [displayMoves]);

  const focusStatus = String(
    focusData?.status ||
      focusData?.planStatus ||
      focusData?.dailyFocus?.status ||
      impactSummary?.status ||
      ''
  ).toLowerCase();

  const focusTone = useMemo(() => {
    return getFocusVisualTone({
      hasUrgentMoves,
      totalMoves: displayMoves.length,
      completedCount,
      focusStatus,
    });
  }, [hasUrgentMoves, displayMoves.length, completedCount, focusStatus]);

  const FocusIcon = focusTone.icon;

  const completionPercentage =
    displayMoves.length > 0
      ? Math.min(100, Math.round((completedCount / displayMoves.length) * 100))
      : 0;
"""

if "const completedCount = useMemo(() => {" not in text:
    if old_display_moves not in text:
        raise SystemExit("Could not find displayMoves declaration. No changes made beyond backup.")
    text = text.replace(old_display_moves, new_display_moves, 1)
    print("✅ Added visual state calculations.")
else:
    print("✅ Visual state calculations already present.")

# 5) Upgrade outer shell classes.
old_shell = """      className={`
        card-action
        ${isCompact ? 'p-5' : 'p-6'} rounded-xl
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        shadow-[0_4px_24px_rgba(139,92,246,0.04)]
        ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : ''}
        ${className}
      `}
"""

new_shell = """      className={`
        relative overflow-hidden card-action
        ${isCompact ? 'p-5' : 'p-6'} rounded-[1.35rem]
        bg-gradient-to-br from-white via-white to-violet-50/30
        dark:from-[#1f1f23] dark:via-[#1f1f23] dark:to-violet-950/10
        border border-slate-200 dark:border-white/10
        ${focusTone.shell}
        ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-[var(--theme-accent-primary)]/80'}
        ${className}
      `}
"""

if old_shell in text:
    text = text.replace(old_shell, new_shell, 1)
    print("✅ Upgraded outer shell styling.")
else:
    print("⚠️ Shell block not found exactly. Skipping shell styling.")

# 6) Add subtle background aura.
old_open_after = """    >
      {/* Header */}"""

new_open_after = """    >
      {!isCompact && (
        <>
          <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-[var(--theme-accent-primary)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        </>
      )}

      {/* Header */}"""

if old_open_after in text:
    text = text.replace(old_open_after, new_open_after, 1)
    print("✅ Added subtle background aura.")
else:
    print("⚠️ Could not add background aura. Skipping.")

# Helper to replace blocks between markers.
def replace_between(source: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = source.find(start_marker)
    if start == -1:
        raise SystemExit(f"Could not find start marker: {start_marker!r}. No changes made beyond backup.")
    end = source.find(end_marker, start)
    if end == -1:
        raise SystemExit(f"Could not find end marker: {end_marker!r}. No changes made beyond backup.")
    return source[:start] + replacement + source[end:]

# 7) Replace header block.
new_header = """      {/* Header */}
      {showHeader && (
        <div className="relative z-10 flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl shadow-sm border border-white/70 dark:border-white/10 ${focusTone.iconShell}`}>
              <FocusIcon className={`w-5 h-5 ${focusTone.iconText}`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Your 3 Moves Today
                </h3>

                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${focusTone.pill}`}>
                  <Clock3 className="w-3 h-3" />
                  {focusTone.label}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1 normal-case tracking-normal">
                What should we work on today?
              </p>

              {hasUrgentMoves && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">
                  Action needed
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCompact && displayMoves.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-[11px] font-black text-slate-600 dark:text-zinc-300 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
                +{resolvedTotalMomentum} possible momentum
              </span>
            )}

            {(isRefreshing || isManualRefreshing) && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Updating...
              </span>
            )}

            {showRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isManualRefreshing}
                className="p-2 rounded-xl text-slate-400 hover:text-[var(--theme-accent-primary)] hover:bg-white dark:hover:bg-white/5 transition-colors disabled:opacity-50 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                title="Refresh moves"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing || isManualRefreshing ? 'animate-spin' : ''
                  }`}
                />
              </button>
            )}

            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--theme-accent-primary)] transition-colors flex items-center gap-1 ml-2"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

"""

text = replace_between(text, "      {/* Header */}", "      {/* Content */}", new_header)
print("✅ Rebuilt header with stronger visual hierarchy.")

# 8) Upgrade briefing panel and move-card wrapper.
old_briefing_start = """          {!isCompact && (
            <div className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">"""

briefing_start = text.find(old_briefing_start)
space_three_marker = '          <div className="space-y-3">'
if briefing_start != -1:
    briefing_end = text.find(space_three_marker, briefing_start)
    if briefing_end == -1:
        raise SystemExit("Could not find move list marker after briefing panel. No changes made beyond backup.")

    new_briefing = """          {!isCompact && (
            <div className={`relative z-10 overflow-hidden rounded-[1.25rem] border px-4 py-4 ${focusTone.briefing}`}>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--theme-accent-primary)] to-cyan-400" />

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-2xl p-2 shadow-sm border border-white/70 dark:border-white/10 ${focusTone.iconShell}`}>
                    <FocusIcon className={`w-4 h-4 ${focusTone.iconText}`} />
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--theme-accent-primary)]">
                      {focusTone.eyebrow}
                    </p>
                    <h4 className="mt-1 text-base font-black text-slate-900 dark:text-zinc-100">
                      {focusTone.briefingTitle}
                    </h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1 max-w-3xl">
                      {focusTone.briefingCopy}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 min-w-[260px]">
                  <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-white/80 dark:border-white/10 px-3 py-2 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Moves
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                      {displayMoves.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-white/80 dark:border-white/10 px-3 py-2 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Done
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                      {completedCount}/{displayMoves.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-white/80 dark:border-white/10 px-3 py-2 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Momentum
                    </p>
                    <p className="mt-1 text-sm font-black text-[var(--theme-accent-primary)]">
                      +{resolvedTotalMomentum}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

"""
    text = text[:briefing_start] + new_briefing + text[briefing_end:]
    print("✅ Upgraded Daily Focus briefing panel.")
else:
    print("⚠️ Briefing panel block not found exactly. Skipping briefing upgrade.")

text = text.replace(
    '          <div className="space-y-3">',
    '          <div className="relative z-10 space-y-3">',
    1,
)

old_map = """            {displayMoves.map((move, index) => (
              <MoveCard
                key={move.id || move._id || move.taskId || `move-${index}`}
                move={move}
                rank={index + 1}
                onClick={onMoveClick}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                showProject={true}
                showActions={!isCompact}
                variant={isCompact ? 'compact' : 'default'}
              />
            ))}"""

new_map = """            {displayMoves.map((move, index) => {
              const moveKey = move.id || move._id || move.taskId || `move-${index}`;
              const moveMomentum = toFiniteNumber(move?.momentum, 0);
              const moveComplete = isMoveComplete(move);

              return (
                <div
                  key={moveKey}
                  className={`
                    group relative rounded-[1.35rem] transition-all duration-200
                    before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b ${focusTone.cardAccent}
                    hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]
                    ${moveComplete ? 'opacity-80' : ''}
                  `}
                >
                  {!isCompact && (
                    <div className="pointer-events-none absolute right-4 top-4 z-10 hidden items-center gap-1 rounded-full bg-white/85 dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 shadow-sm md:flex">
                      <Zap className="w-3 h-3 text-[var(--theme-accent-primary)]" />
                      +{moveMomentum}
                    </div>
                  )}

                  <MoveCard
                    move={move}
                    rank={index + 1}
                    onClick={onMoveClick}
                    onComplete={handleComplete}
                    onSnooze={handleSnooze}
                    showProject={true}
                    showActions={!isCompact}
                    variant={isCompact ? 'compact' : 'default'}
                  />
                </div>
              );
            })}"""

if old_map in text:
    text = text.replace(old_map, new_map, 1)
    print("✅ Wrapped MoveCard list in mission-card visual treatment.")
else:
    print("⚠️ MoveCard map block not found exactly. Skipping move-card wrapper.")

# 9) Replace footer impact summary.
footer_start = text.find("      {/* Footer - Impact Summary */}")
empty_start = text.find("function EmptyState")

if footer_start == -1 or empty_start == -1 or empty_start < footer_start:
    raise SystemExit("Could not safely locate footer block. No changes made beyond backup.")

component_end = text.rfind("\n    </div>\n  );\n}", 0, empty_start)
if component_end == -1:
    raise SystemExit("Could not safely locate YourMovesToday component ending. No changes made beyond backup.")

new_footer = """      {/* Footer - Impact Summary */}
      {showFooter && displayMoves.length > 0 && (
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.18em]">
                Complete all{' '}
                <strong className="text-slate-800 dark:text-zinc-200">
                  {displayMoves.length}
                </strong>{' '}
                to unlock
              </span>

              <div className="mt-2 h-2 w-full max-w-sm rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${focusTone.progress}`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {resolvedTotalUnblocks > 0 && (
                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-400/20 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
                  Unblock {resolvedTotalUnblocks} teammates
                </span>
              )}

              <span className="flex items-center gap-1.5 text-[12px] font-black text-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)] border border-violet-100 dark:border-violet-400/20 px-3 py-1.5 rounded-xl shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-[var(--theme-accent-primary)]/20" />
                +{resolvedTotalMomentum} Momentum
              </span>
            </div>
          </div>
        </div>
      )}
"""

text = text[:footer_start] + new_footer + text[component_end:]
print("✅ Upgraded reward footer with progress rail.")

# 10) Replace EmptyState fully and safely.
empty_start = text.find("function EmptyState")
widget_start = text.find("export function YourMovesWidget")

if empty_start == -1 or widget_start == -1 or widget_start < empty_start:
    raise SystemExit("Could not safely locate EmptyState for replacement. No changes made beyond backup.")

new_empty_state = """function EmptyState({ onRefresh }) {
  const goToProjects = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="relative overflow-hidden py-12 px-5 text-center bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/50 dark:from-teal-500/10 dark:via-white/[0.03] dark:to-cyan-500/5 rounded-[1.35rem] border border-teal-100 dark:border-teal-500/10">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm border border-white/80 dark:border-white/10">
          <Flame className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300 mb-2">
          Daily focus clear
        </p>

        <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
          All caught up! 🎉
        </h4>

        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6 max-w-xl mx-auto">
          No critical moves right now. Create a project or add tasks inside one of your projects to start building momentum.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={goToProjects}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Create Project
          </button>

          <button
            type="button"
            onClick={goToProjects}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            View Projects
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </button>
        </div>
      </div>
    </div>
  );
}
"""

text = text[:empty_start] + new_empty_state + "\n\n" + text[widget_start:]
print("✅ Rebuilt EmptyState cleanly.")

# 11) Safety checks.
checks = {
    "export default function YourMovesToday": 1,
    "function EmptyState": 1,
    "export function YourMovesWidget": 1,
    "export function FocusBanner": 1,
    "function getFocusVisualTone": 1,
}

for item, expected_count in checks.items():
    actual_count = text.count(item)
    if actual_count != expected_count:
        raise SystemExit(
            f"Safety check failed: `{item}` count is {actual_count}, expected {expected_count}. No final write."
        )

if re.search(r"function EmptyState[\s\S]*export function YourMovesWidget[\s\S]*\}\s*$", text) is None:
    raise SystemExit("Safety check failed: could not verify EmptyState closes before YourMovesWidget. No final write.")

if "export function YourMovesWidget" in text[text.find("function EmptyState"):text.find("function EmptyState") + 1500]:
    raise SystemExit("Safety check failed: YourMovesWidget appears too close to EmptyState start. No final write.")

path.write_text(text)

print("✅ YourMovesToday.jsx visual refinement complete.")
print("✅ Backend untouched.")
print("✅ Existing exports preserved.")
print("✅ Next: run npm run build or npm run dev.")

from pathlib import Path
from datetime import datetime

path = Path("src/components/focus/MoveCard.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/MoveCard.jsx. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/components/focus/MoveCard.jsx.bak-before-done-state-polish-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

# 1) Add safe helpers after getRankStyle.
marker = "const getRankStyle = (rank) => RANK_STYLES[rank] || RANK_STYLES[3];\n"

helpers = """const getRankStyle = (rank) => RANK_STYLES[rank] || RANK_STYLES[3];

function isMoveDone(move) {
  const status = String(move?.status || '').toLowerCase();
  return status === 'done' || status === 'completed' || status === 'complete';
}

function isDailyFocusMove(move) {
  const id = String(move?.id || '');
  return Boolean(
    move?.isDailyFocusMove ||
      id.startsWith('task_') ||
      id.startsWith('project_') ||
      id.startsWith('custom_')
  );
}

function getMoveTargetId(move) {
  return move?.taskId || move?._id || move?.id || move?.sourceId || '';
}

function getMomentumValue(move) {
  const value = Number(move?.momentum ?? move?.estimatedMomentum ?? 0);
  return Number.isFinite(value) ? value : 0;
}
"""

if marker not in text:
    raise SystemExit("❌ Could not find getRankStyle marker. No changes written.")

text = text.replace(marker, helpers, 1)

# 2) Add completed-state variables inside MoveCard.
old_vars = """  const typeConfig = TYPE_CONFIG[move.type] || TYPE_CONFIG.default;
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);
  const rankStyle = rank ? getRankStyle(rank) : getRankStyle(3);
  const isCompact = variant === 'compact';
"""

new_vars = """  const typeConfig = TYPE_CONFIG[move.type] || TYPE_CONFIG.default;
  const TypeIcon = typeConfig.icon;
  const urgencyLevel = getUrgencyLevel(move.deadline);
  const urgencyStyles = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.none;
  const timeLeft = getTimeUntilDeadline(move.deadline);
  const rankStyle = rank ? getRankStyle(rank) : getRankStyle(3);
  const isCompact = variant === 'compact';
  const moveDone = isMoveDone(move);
  const dailyFocusMove = isDailyFocusMove(move);
  const shouldVisuallyExit = isExiting && !dailyFocusMove;
  const doneVisual = moveDone || shouldVisuallyExit;
  const momentumValue = getMomentumValue(move);
"""

if old_vars not in text:
    raise SystemExit("❌ Could not find MoveCard variable block. No changes written.")

text = text.replace(old_vars, new_vars, 1)

# 3) Replace complete handler so Daily Focus moves do NOT disappear.
old_complete_handler = """  // 🚨 BEHAVIORAL FIX: Instant animation, then propagate up
  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isExiting) return;
    
    // Trigger visual exit instantly
    setIsExiting(true);
    
    // Give the animation 300ms to play before destroying the component from state
    setTimeout(async () => {
      const targetId = move.taskId || move._id || move.id;
      if (targetId && onComplete) {
        await onComplete(targetId);
      }
    }, 300);
  }, [move, onComplete, isExiting]);
"""

new_complete_handler = """  // Daily Focus moves should stay visible after completion.
  // Legacy task moves can still use the old exit animation.
  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isExiting || moveDone) return;

    const targetId = getMoveTargetId(move);

    if (!targetId || !onComplete) return;

    if (dailyFocusMove) {
      await onComplete(targetId);
      return;
    }

    setIsExiting(true);

    setTimeout(async () => {
      await onComplete(targetId);
    }, 300);
  }, [move, onComplete, isExiting, moveDone, dailyFocusMove]);
"""

if old_complete_handler not in text:
    raise SystemExit("❌ Could not find complete handler block. No changes written.")

text = text.replace(old_complete_handler, new_complete_handler, 1)

# 4) Make snooze use the same safe target id helper.
text = text.replace(
    "      const targetId = move.taskId || move._id || move.id;\n      if (targetId && onSnooze) onSnooze(targetId, 4);",
    "      const targetId = getMoveTargetId(move);\n      if (targetId && onSnooze) onSnooze(targetId, 4);",
    1,
)

# 5) Replace card shell classes to support done state.
old_card_classes = """        ${rankStyle.cardBg} border ${rankStyle.borderAccent}
        ${urgencyStyles.border ? `border-l-2 ${urgencyStyles.border}` : ''}
        ${urgencyStyles.bg}
        
        /* 🚨 SMOOTH EXIT ANIMATION */
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 scale-95 -translate-x-4 pointer-events-none' : 'opacity-100 scale-100'}
        ${isHovered && !isExiting ? 'transform -translate-y-[2px] shadow-lg shadow-black/20' : ''}
        relative z-10 hover:z-20
"""

new_card_classes = """        ${
          moveDone
            ? 'border border-emerald-200/80 bg-emerald-50/70 shadow-sm shadow-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            : `${rankStyle.cardBg} border ${rankStyle.borderAccent}`
        }
        ${urgencyStyles.border && !moveDone ? `border-l-2 ${urgencyStyles.border}` : ''}
        ${!moveDone ? urgencyStyles.bg : ''}
        
        /* Smooth Daily Focus completion behavior */
        transition-all duration-300 ease-in-out
        ${shouldVisuallyExit ? 'opacity-0 scale-95 -translate-x-4 pointer-events-none' : 'opacity-100 scale-100'}
        ${isHovered && !shouldVisuallyExit && !moveDone ? 'transform -translate-y-[2px] shadow-lg shadow-black/20' : ''}
        ${moveDone ? 'cursor-default' : ''}
        relative z-10 hover:z-20
"""

if old_card_classes not in text:
    raise SystemExit("❌ Could not find card class block. No changes written.")

text = text.replace(old_card_classes, new_card_classes, 1)

# 6) Replace rank/icon block and fix TypeConfig.icon typo.
old_rank_block = """        {rank ? (
          <div className={`shrink-0 w-8 h-8 rounded-xl ${rankStyle.rankBg} shadow-inner flex items-center justify-center mt-0.5`}>
            <span className={`text-sm tracking-tighter ${rankStyle.rankText}`}>#{rank}</span>
          </div>
        ) : (
          <div className={`shrink-0 p-2.5 rounded-xl ${typeConfig.bg} mt-0.5`}>
            <TypeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />
          </div>
        )}
"""

new_rank_block = """        {rank ? (
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
              moveDone
                ? 'bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-500/15 dark:text-emerald-300'
                : `${rankStyle.rankBg} shadow-inner`
            }`}
          >
            {moveDone ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <span className={`text-sm tracking-tighter ${rankStyle.rankText}`}>#{rank}</span>
            )}
          </div>
        ) : (
          <div className={`shrink-0 p-2.5 rounded-xl ${moveDone ? 'bg-emerald-100 dark:bg-emerald-500/15' : typeConfig.bg} mt-0.5`}>
            {moveDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
            )}
          </div>
        )}
"""

if old_rank_block not in text:
    raise SystemExit("❌ Could not find rank/icon block. No changes written.")

text = text.replace(old_rank_block, new_rank_block, 1)

# 7) Done visual for content wrapper.
text = text.replace(
    "        <div className={`flex-1 min-w-0 pr-2 transition-all duration-300 ${isExiting ? 'opacity-50 line-through grayscale' : ''}`}>",
    "        <div className={`flex-1 min-w-0 pr-2 transition-all duration-300 ${doneVisual ? 'opacity-75 grayscale-[0.15]' : ''}`}>",
    1,
)

# 8) Done-aware title styling.
old_title = """          <h4 className={`${rankStyle.titleSize} text-text-primary group-hover:text-brand transition-colors ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {move.title}
          </h4>
"""

new_title = """          <h4
            className={`${rankStyle.titleSize} transition-colors ${
              moveDone
                ? 'text-slate-500 line-through decoration-emerald-500/50 decoration-2 group-hover:text-slate-500 dark:text-zinc-400'
                : 'text-text-primary group-hover:text-brand'
            } ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}
          >
            {move.title}
          </h4>
"""

if old_title not in text:
    raise SystemExit("❌ Could not find title block. No changes written.")

text = text.replace(old_title, new_title, 1)

# 9) Add Done badge and use momentumValue.
old_momentum = """          <div className={`flex flex-wrap items-center gap-3.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md text-[11px] font-bold text-brand shadow-sm shadow-brand/5">
              <Zap className="w-3 h-3" />+{move.momentum || 0}
            </span>
"""

new_momentum = """          <div className={`flex flex-wrap items-center gap-3.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            {moveDone && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-black text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}

            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold shadow-sm ${
              moveDone
                ? 'border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400'
                : 'bg-brand/10 border-brand/20 text-brand shadow-brand/5'
            }`}>
              <Zap className="w-3 h-3" />+{momentumValue}
            </span>
"""

if old_momentum not in text:
    raise SystemExit("❌ Could not find momentum block. No changes written.")

text = text.replace(old_momentum, new_momentum, 1)

# 10) Replace complete action button.
old_button = """              <button 
                onClick={handleComplete} 
                disabled={isExiting} 
                className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-90 ${isExiting ? 'bg-success border-success text-white shadow-lg shadow-success/20' : 'bg-surface-2 border-white/[0.08] text-success/70 hover:bg-success hover:border-success hover:text-white hover:shadow-lg hover:shadow-success/20'} disabled:opacity-50`} 
                title="Mark complete"
              >
                <CheckCircle2 className={`w-5 h-5`} />
              </button>
"""

new_button = """              <button
                onClick={handleComplete}
                disabled={isExiting || moveDone}
                className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-90 ${
                  moveDone
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-default'
                    : isExiting
                      ? 'bg-success border-success text-white shadow-lg shadow-success/20'
                      : 'bg-surface-2 border-white/[0.08] text-success/70 hover:bg-success hover:border-success hover:text-white hover:shadow-lg hover:shadow-success/20'
                } disabled:opacity-100`}
                title={moveDone ? 'Completed' : 'Mark complete'}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
"""

if old_button not in text:
    raise SystemExit("❌ Could not find complete button block. No changes written.")

text = text.replace(old_button, new_button, 1)

required = [
    "function isMoveDone(move)",
    "function isDailyFocusMove(move)",
    "function getMoveTargetId(move)",
    "const TypeIcon = typeConfig.icon;",
    "const moveDone = isMoveDone(move);",
    "const dailyFocusMove = isDailyFocusMove(move);",
    "shouldVisuallyExit",
    "Done",
    "title={moveDone ? 'Completed' : 'Mark complete'}",
]

for item in required:
    if item not in text:
        raise SystemExit(f"❌ Safety check failed: missing `{item}`. No changes written.")

if text.count("export default function MoveCard") != 1:
    raise SystemExit("❌ Safety check failed: MoveCard export count changed. No changes written.")

path.write_text(text)

print("✅ MoveCard.jsx now respects persisted done/completed status.")
print("✅ Daily Focus completed moves stay visible instead of disappearing.")
print("✅ Complete button becomes a locked green completed icon.")
print("✅ Rank icon turns into a completed checkmark.")
print("✅ Momentum now reads move.momentum OR move.estimatedMomentum.")
print("✅ Backend untouched.")
print("")
print("Next checks:")
print("rg -n \"isMoveDone|moveDone|Done|shouldVisuallyExit|TypeIcon\" src/components/focus/MoveCard.jsx -C 4")

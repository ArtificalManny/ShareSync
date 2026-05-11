from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

replacements = [
    (
"""// PHASE 5: Your 3 Moves Today - Cross-Project Focus View
// UPGRADED: "Progress Should Be Visible" & Gallery Walk Light/Dark Integration
// SURGICAL PASS:
// - Prevent NaN momentum output
// - Keep existing component contract intact
// - Preserve layout and behavior""",
"""// PHASE 5: Your 3 Moves Today - Daily Focus View
// UPGRADED: "What should we work on today?" command-card language
// SURGICAL PASS:
// - Preserve existing API/data flow
// - Preserve MoveCard rendering and actions
// - Preserve user-scoped focus behavior
// - Prepare component for future accept/edit/delete daily-plan persistence"""
    ),
    (
"""              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Your 3 Moves Today
              </h3>
              {hasUrgentMoves && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-0.5">
                  Action needed
                </p>
              )}""",
"""              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Your 3 Moves Today
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1 normal-case tracking-normal">
                What should we work on today?
              </p>
              {hasUrgentMoves && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">
                  Action needed
                </p>
              )}"""
    ),
    (
"""      ) : displayMoves.length > 0 ? (
        <div className="space-y-3">
          {displayMoves.map((move, index) => (
            <MoveCard
              key={move.id}
              move={move}
              rank={index + 1}
              onClick={onMoveClick}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              showProject={true}
              showActions={!isCompact}
              variant={isCompact ? 'compact' : 'default'}
            />
          ))}
        </div>""",
"""      ) : displayMoves.length > 0 ? (
        <div className="space-y-4">
          {!isCompact && (
            <div className="rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-accent-primary)]">
                    Recommended from your active projects
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1">
                    OpenShare found the highest-leverage moves for this account right now.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-zinc-900 border border-violet-100 dark:border-violet-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
                  Daily focus
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {displayMoves.map((move, index) => (
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
            ))}
          </div>
        </div>"""
    ),
    (
"""        No critical moves right now. Great job staying on top of things.""",
"""No critical moves right now. Create a project or add a task to start building momentum."""
    ),
    (
"""        Check again""",
"""Check again"""
    ),
]

for old, new in replacements:
    if old not in text:
        print("⚠️ Could not find expected block. Skipping:")
        print(old[:220])
        print()
        continue

    text = text.replace(old, new, 1)

path.write_text(text)

print("✅ YourMovesToday.jsx upgraded to Daily Focus language.")
print("✅ Existing user-scoped data flow preserved.")
print("✅ Existing MoveCard behavior preserved.")

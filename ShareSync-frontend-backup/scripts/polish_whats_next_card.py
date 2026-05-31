from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()
backup = path.with_name(
    f"ProjectHome.jsx.bak-before-whats-next-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

changed = 0

# 1) Add onOpenNextMoves to OverviewView props.
if "onOpenNextMoves," not in text:
    old = "  onSprintAction,\n  onFinishLineAction,"
    new = "  onSprintAction,\n  onOpenNextMoves,\n  onFinishLineAction,"
    if old in text:
        text = text.replace(old, new, 1)
        changed += 1
    else:
        print("⚠️ Could not insert onOpenNextMoves into OverviewView props.")

# 2) Insert dedicated NextMoveSignalCard before OverviewSignalCard.
if "function NextMoveSignalCard(" not in text:
    marker = "function OverviewSignalCard({"
    if marker not in text:
        raise SystemExit("❌ Could not find function OverviewSignalCard.")

    next_move_card = r'''
function NextMoveSignalCard({
  title,
  caption,
  activeGoalCount = 0,
  onOpenNextMoves,
}) {
  const safeTitle = String(title || "").trim() || "No priority surfaced yet";
  const hasPriority =
    safeTitle.toLowerCase() !== "no priority surfaced yet";

  const statusLabel = hasPriority ? "Ready" : "Awaiting signal";
  const signalText = hasPriority
    ? "A ranked move is ready to execute."
    : "Open tasks, blockers, or goals will surface the next move.";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 dark:border-violet-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <Flag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  What’s next
                </p>

                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  Next move
                </span>

                {activeGoalCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                    {activeGoalCount} goal{activeGoalCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <h3 className="max-w-[520px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeTitle}
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption || signalText}
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              Signal
            </p>
            <p className="mt-1 text-xs font-black text-violet-700 dark:text-violet-300">
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-black/20 dark:text-violet-300">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                  Execution cue
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-zinc-200">
                  {signalText}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenNextMoves}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700 shadow-sm transition-all hover:-translate-y-[1px] hover:bg-violet-50 hover:shadow-md dark:border-violet-500/20 dark:bg-white/[0.04] dark:text-violet-300 dark:hover:bg-violet-500/10"
            >
              <span>Open Next Moves</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

'''
    text = text.replace(marker, next_move_card + "\n" + marker, 1)
    changed += 1

# 3) Replace only the What's next OverviewSignalCard.
pattern = re.compile(
    r'''<OverviewSignalCard\s+
\s*icon=\{(?:Flag|Target|Route)\}\s+
\s*label="What’s next"\s+
\s*value=\{nextActionTitle\}\s+
\s*caption=\{\s*
\s*activeGoalCount > 0\s*
\s*\?\s*`\$\{activeGoalCount\} active goal\$\{activeGoalCount === 1 \? "" : "s"\} shaping priorities`\s*
\s*:\s*"Surface the next action before opening deeper views"\s*
\s*\}\s+
\s*tone="violet"\s+
\s*/>''',
    re.MULTILINE,
)

replacement = '''<NextMoveSignalCard
            title={nextActionTitle}
            activeGoalCount={activeGoalCount}
            caption={
              activeGoalCount > 0
                ? `${activeGoalCount} active goal${activeGoalCount === 1 ? "" : "s"} shaping priorities`
                : "Surface the next action before opening deeper views"
            }
            onOpenNextMoves={onOpenNextMoves}
          />'''

text, count = pattern.subn(replacement, text, count=1)
changed += count

if count == 0:
    raise SystemExit(
        "❌ Could not replace the What's next OverviewSignalCard. Run:\n"
        "rg -n \"label=\\\"What’s next\\\"|OverviewSignalCard|NextMoveSignalCard\" src/pages/ProjectHome.jsx -C 20"
    )

# 4) Pass the tab-switch handler from ProjectHome into OverviewView.
if 'onOpenNextMoves={() => setActiveView("suggestions")}' not in text:
    old = "              onSprintAction={handleSprintAction}\n              onFinishLineAction={handleFinishLineAction}"
    new = "              onSprintAction={handleSprintAction}\n              onOpenNextMoves={() => setActiveView(\"suggestions\")}\n              onFinishLineAction={handleFinishLineAction}"
    if old in text:
        text = text.replace(old, new, 1)
        changed += 1
    else:
        print("⚠️ Could not add onOpenNextMoves prop to OverviewView render call.")

path.write_text(text)

print("")
print(f"✅ What's next card visually polished. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "function NextMoveSignalCard|onOpenNextMoves|Open Next Moves|What’s next|Execution cue" src/pages/ProjectHome.jsx -C 10')

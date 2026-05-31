from pathlib import Path
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("ERROR: Could not find src/pages/ProjectHome.jsx")

text = path.read_text()
backup = path.with_name(
    f"ProjectHome.jsx.bak-before-whats-next-polish-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

changed = 0

# 1) Add onOpenNextMoves to OverviewView props.
if "onOpenNextMoves," not in text:
    needle = "  onSprintAction,\n"
    if needle not in text:
        raise SystemExit("ERROR: Could not find onSprintAction in OverviewView props.")
    text = text.replace(needle, needle + "  onOpenNextMoves,\n", 1)
    changed += 1

# 2) Insert dedicated polished card before OverviewSignalCard.
if "function NextMoveSignalCard(" not in text:
    marker = "function OverviewSignalCard({"
    if marker not in text:
        raise SystemExit("ERROR: Could not find function OverviewSignalCard.")

    new_component = r'''
function NextMoveSignalCard({
  title,
  caption,
  activeGoalCount = 0,
  onOpenNextMoves,
}) {
  const safeTitle = String(title || "").trim() || "No priority surfaced yet";
  const hasPriority = safeTitle.toLowerCase() !== "no priority surfaced yet";

  const statusLabel = hasPriority ? "Ready" : "Scanning";
  const executionCue = hasPriority
    ? "This is the highest-leverage move surfaced from the project signal."
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
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  What’s next
                </p>

                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  Next move
                </span>

                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                  {statusLabel}
                </span>
              </div>

              <h3 className="max-w-[560px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeTitle}
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
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
                  {executionCue}
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
    text = text.replace(marker, new_component + "\n" + marker, 1)
    changed += 1

# 3) Replace only the OverviewSignalCard block inside OverviewView that has label="What’s next".
view_start = text.find("function OverviewView(")
if view_start == -1:
    raise SystemExit("ERROR: Could not find function OverviewView.")

label_index = text.find('label="What’s next"', view_start)
if label_index == -1:
    label_index = text.find('label="What\'s next"', view_start)

if label_index == -1:
    raise SystemExit("ERROR: Could not find the What's next label inside OverviewView.")

block_start = text.rfind("<OverviewSignalCard", view_start, label_index)
if block_start == -1:
    raise SystemExit("ERROR: Could not find the opening OverviewSignalCard for What's next.")

block_end = text.find("/>", label_index)
if block_end == -1:
    raise SystemExit("ERROR: Could not find the closing /> for the What's next card.")

block_end += 2

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

text = text[:block_start] + replacement + text[block_end:]
changed += 1

# 4) Pass handler from ProjectHome render into OverviewView.
if 'onOpenNextMoves={() => setActiveView("suggestions")}' not in text:
    needle = "              onSprintAction={handleSprintAction}\n"
    if needle not in text:
        raise SystemExit("ERROR: Could not find OverviewView onSprintAction render prop.")
    text = text.replace(
        needle,
        needle + '              onOpenNextMoves={() => setActiveView("suggestions")}\n',
        1,
    )
    changed += 1

path.write_text(text)

print("")
print("SUCCESS: What's next card polished.")
print(f"Changes: {changed}")
print(f"Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "function NextMoveSignalCard|onOpenNextMoves|Open Next Moves|Execution cue|label=\\"What’s next\\"" src/pages/ProjectHome.jsx -C 10')

from pathlib import Path
import sys

ROOT = Path.cwd()
EVOLUTION = ROOT / "src/components/growth/EvolutionMoments.jsx"

def fail(message):
    print(f"\n[collapse_evolution_history_list] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

OLD_SAFE_MOMENTS = """  const safeMoments = Array.isArray(moments) ? moments : [];"""

NEW_SAFE_MOMENTS = """  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const safeMoments = Array.isArray(moments) ? moments : [];
  const currentMoments = safeMoments.slice(0, 1);
  const historyMoments = safeMoments.slice(1);
  const hasHistory = historyMoments.length > 0;"""

OLD_RENDER_BLOCK = """          <div className="space-y-4">
            {safeMoments.map((moment, index) => (
              <EvolutionCard
                key={moment?.id || moment?._id || `${moment?.from || 'moment'}-${moment?.to || index}`}
                moment={moment}
                isLatest={index === 0}
              />
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/65 p-5 dark:border-white/[0.16] dark:bg-white/[0.035]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.08]">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <p className="mb-0.5 text-sm font-black uppercase tracking-[0.12em] text-slate-800 dark:text-zinc-200">
                  Next Evolution
                </p>
                <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                  Continue growing to unlock{' '}
                  <span className="text-slate-800 dark:text-zinc-200">
                    {safeMoments[0]?.to === 'Architect' ? 'Leader' : 'Architect'}
                  </span>{' '}
                  status.
                </p>
              </div>
            </div>
          </div>"""

NEW_RENDER_BLOCK = """          <div className="space-y-4">
            {currentMoments.map((moment, index) => (
              <EvolutionCard
                key={moment?.id || moment?._id || `${moment?.from || 'moment'}-${moment?.to || index}`}
                moment={moment}
                isLatest
              />
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
            <button
              type="button"
              onClick={() => setIsHistoryOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.08]">
                  <Target className="h-5 w-5" />
                </div>

                <div>
                  <p className="mb-0.5 text-sm font-black uppercase tracking-[0.12em] text-slate-800 dark:text-zinc-200">
                    Evolution History
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                    {hasHistory
                      ? `${historyMoments.length} previous milestone${historyMoments.length === 1 ? '' : 's'} plus your next evolution target.`
                      : 'View your next evolution target.'}
                  </p>
                </div>
              </div>

              {isHistoryOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" />
              )}
            </button>

            {isHistoryOpen && (
              <div className="border-t border-slate-200/80 p-4 dark:border-white/[0.08]">
                {hasHistory && (
                  <div className="space-y-4">
                    {historyMoments.map((moment, index) => (
                      <EvolutionCard
                        key={moment?.id || moment?._id || `${moment?.from || 'moment'}-${moment?.to || index + 1}`}
                        moment={moment}
                        isLatest={false}
                      />
                    ))}
                  </div>
                )}

                <div className={hasHistory ? 'mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-white/[0.16] dark:bg-white/[0.035]' : 'rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-white/[0.16] dark:bg-white/[0.035]'}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.08]">
                      <Target className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="mb-0.5 text-sm font-black uppercase tracking-[0.12em] text-slate-800 dark:text-zinc-200">
                        Next Evolution
                      </p>
                      <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                        Continue growing to unlock{' '}
                        <span className="text-slate-800 dark:text-zinc-200">
                          {safeMoments[0]?.to === 'Architect' ? 'Leader' : 'Architect'}
                        </span>{' '}
                        status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>"""

def main():
    print("[collapse_evolution_history_list] starting")

    if not EVOLUTION.exists():
        fail(f"Could not find {EVOLUTION}")

    source = EVOLUTION.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function EvolutionMoments",
        "function EvolutionCard",
        "Next Evolution",
        "safeMoments.map",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "currentMoments = safeMoments.slice(0, 1)" in source and "Evolution History" in source:
        print("[collapse_evolution_history_list] Evolution history already appears collapsed")
        return

    if OLD_SAFE_MOMENTS not in source:
        fail("Could not find safeMoments anchor. No changes were written.")

    if OLD_RENDER_BLOCK not in source:
        fail("Could not find exact full evolution list + Next Evolution block. No changes were written.")

    source = source.replace(OLD_SAFE_MOMENTS, NEW_SAFE_MOMENTS, 1)
    source = source.replace(OLD_RENDER_BLOCK, NEW_RENDER_BLOCK, 1)

    required_after = [
        "isHistoryOpen",
        "setIsHistoryOpen",
        "currentMoments = safeMoments.slice(0, 1)",
        "historyMoments = safeMoments.slice(1)",
        "Evolution History",
        "previous milestone",
        "Next Evolution",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = EVOLUTION.with_suffix(EVOLUTION.suffix + ".bak-collapsed-history")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[collapse_evolution_history_list] backup created: {backup}")

    EVOLUTION.write_text(source, encoding="utf-8")
    print(f"[collapse_evolution_history_list] patched: {EVOLUTION}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"isHistoryOpen|Evolution History|currentMoments|historyMoments|Next Evolution\" src/components/growth/EvolutionMoments.jsx")
    print("  git diff -- src/components/growth/EvolutionMoments.jsx")

if __name__ == "__main__":
    main()

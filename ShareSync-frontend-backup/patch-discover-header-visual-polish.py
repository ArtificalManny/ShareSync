from pathlib import Path
from datetime import datetime

path = Path("src/pages/Discover.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-discover-header-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

start_marker = "        {/* Network hero */}"
end_marker = "        {/* Shipping now */}"

if start_marker not in text:
    raise RuntimeError("Could not find Discover hero start marker. No changes were written.")

if end_marker not in text:
    raise RuntimeError("Could not find Shipping Now marker. No changes were written.")

start = text.index(start_marker)
end = text.index(end_marker)

new_header = """        {/* Network hero */}
        <section className="mb-8 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/85 shadow-sm ring-1 ring-white/70 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0f1118]/88 dark:ring-white/[0.04]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.15),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.88),rgba(240,253,250,0.38))] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.20),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.12),transparent_32%),linear-gradient(135deg,rgba(17,17,24,0.96),rgba(8,15,28,0.88))]" />
            <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Live Network
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300 sm:inline-flex">
                  <Radio className="h-3.5 w-3.5 text-emerald-500" />
                  Public signal layer online
                </div>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-5 flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-[2rem] bg-violet-500/30 blur-xl" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-[2rem] border border-white/60 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-2xl shadow-violet-500/25 dark:border-white/[0.12]">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    </div>

                    <div>
                      <h1 className="bg-gradient-to-r from-slate-950 via-violet-700 to-cyan-600 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-violet-200 dark:to-cyan-200 sm:text-6xl">
                        Discover
                      </h1>
                      <p className="mt-1 text-sm font-bold text-slate-500 dark:text-zinc-400 sm:text-base">
                        The heartbeat of the OpenShare network
                      </p>
                    </div>
                  </div>

                  <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-zinc-300 sm:text-base">
                    Track what is shipping, find projects gaining momentum, and follow the teams turning quiet work into visible progress.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Momentum
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                      <Activity className="h-3.5 w-3.5" />
                      Live Signals
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                      <Trophy className="h-3.5 w-3.5" />
                      Ships
                    </span>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-xl">
                  <NetworkStatCard
                    icon={Activity}
                    label="Signals"
                    value={liveSignals}
                    tone="emerald"
                  />
                  <NetworkStatCard
                    icon={Trophy}
                    label="Ships"
                    value={totalShips}
                    tone="amber"
                  />
                  <NetworkStatCard
                    icon={Zap}
                    label="Streak"
                    value={`${streakDays}d`}
                    tone="violet"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

"""

text = text[:start] + new_header + text[end:]

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in text:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

path.write_text(text)

print("Discover header visual polish applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Discover hero/header JSX block")
print("- No APIs, feed logic, state, hooks, child components, or backend files were touched.")

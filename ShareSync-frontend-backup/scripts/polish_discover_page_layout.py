#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/Discover.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[polish_discover_page_layout] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[polish_discover_page_layout] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "import { Sparkles, Loader2, Globe } from 'lucide-react';",
        "export default function Discover() {",
        "const isMobile = useIsMobile();",
        "const { user } = useAuth();",
        "<TeamStories />",
        "<FeaturedProjects maxVisible={6} />",
        "<ActivityFeed activities={formatActivityItems(feed.filter(item => {",
        "className=\"max-w-2xl mx-auto px-4 sm:px-6 py-8\"",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Upgrade lucide imports used by the new Discover composition.
    old_icon_import = "import { Sparkles, Loader2, Globe } from 'lucide-react';"
    new_icon_import = """import {
  Activity,
  Globe,
  Loader2,
  Radio,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';"""

    if new_icon_import not in source:
        source = source.replace(old_icon_import, new_icon_import, 1)
        print("[polish_discover_page_layout] upgraded lucide imports")
    else:
        print("[polish_discover_page_layout] lucide imports already upgraded")

    # 2) Insert lightweight page helper components before Discover().
    helper_marker = "function NetworkStatCard({ icon: Icon, label, value, tone = 'violet' }) {"

    helpers = """
function NetworkStatCard({ icon: Icon, label, value, tone = 'violet' }) {
  const toneClasses = {
    violet: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.violet}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/70 dark:bg-white/[0.06] flex items-center justify-center shadow-sm">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-lg font-bold leading-none tabular-nums">{value}</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70 mt-1">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkPulsePanel({ liveSignals, totalShips, streakDays }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.06] bg-white/85 dark:bg-[#111116]/85 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Network Pulse
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Live public signals from the OpenShare network.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] px-4 py-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Signals loaded</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{liveSignals}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] px-4 py-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Your ships</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{totalShips}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] px-4 py-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Current streak</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{streakDays}d</span>
        </div>
      </div>
    </div>
  );
}

"""

    if helper_marker not in source:
        insertion_point = 'export default function Discover() {'
        if insertion_point not in source:
            fail("Could not find Discover component insertion point.")
        source = source.replace(insertion_point, helpers + insertion_point, 1)
        print("[polish_discover_page_layout] inserted Discover layout helper components")
    else:
        print("[polish_discover_page_layout] helper components already present")

    # 3) Insert derived display values before return.
    derived_marker = "const publicFeedItems = feed.filter((item) => {"

    derived_values = """  const publicFeedItems = feed.filter((item) => {
    const name = item.user?.displayName || item.user?.username || item.user || '';
    return name !== 'demo' && name !== 'Demo User';
  });

  const publicActivities = formatActivityItems(publicFeedItems);
  const liveSignals = publicFeedItems.length;
  const totalShips = user?.totalShips || user?.ships || 0;
  const streakDays = user?.streakDays || user?.currentStreak || 0;
  const currentLevel = user?.level || 1;
  const currentXp = user?.xp || 0;
"""

    return_marker = "  return ("
    if derived_marker not in source:
        if return_marker not in source:
            fail("Could not find return insertion point.")
        source = source.replace(return_marker, derived_values + "\n" + return_marker, 1)
        print("[polish_discover_page_layout] inserted derived Discover display values")
    else:
        print("[polish_discover_page_layout] derived values already present")

    # 4) Replace only the JSX return layout. Preserve all data loading logic above.
    start = source.find('  return (\n    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24 transition-colors">')
    if start == -1:
        fail("Could not find current Discover return block start.")

    end_marker = "\n  );\n}"
    end = source.rfind(end_marker)
    if end == -1 or end <= start:
        fail("Could not find Discover return block end.")

    old_return = source[start:end + len(end_marker)]

    new_return = """  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#09090B] pb-24 transition-colors">
      {/* Ambient network glows — quiet, not loud */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" />
      <div className="pointer-events-none absolute top-40 right-[-12rem] h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-900/10" />
      <div className="pointer-events-none absolute bottom-20 left-[-10rem] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Network hero */}
        <section className="mb-8 rounded-[2rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm overflow-hidden">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.16),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(45,212,191,0.12),transparent_28%)]" />

            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300 mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live Network
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      Discover
                    </h1>
                    <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-zinc-400 mt-1">
                      The heartbeat of the network 🌐
                    </p>
                  </div>
                </div>

                <p className="text-sm sm:text-base leading-7 text-slate-600 dark:text-zinc-300 max-w-xl">
                  Track what is shipping, find projects gaining momentum, and follow the teams turning quiet work into visible progress.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 w-full lg:max-w-xl">
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
        </section>

        {/* Shipping now */}
        <section className="mb-8 rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-white">
                  Shipping Now
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Live movement from people and projects across the network.
              </p>
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-5">
            <TeamStories />
          </div>
        </section>

        {/* Main dashboard grid */}
        {feed.length === 0 && initialLoadDone && !loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)] gap-6">
            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm p-5 sm:p-6">
                <FeaturedProjects maxVisible={3} />
              </section>

              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-[1.75rem] bg-white/60 dark:bg-[#111116]/60">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Globe className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  It's quiet out here...
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No public projects found in the network yet. Make sure your projects are set to <strong>Public</strong> to see them in the algorithmic feed.
                </p>
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 self-start">
              <NetworkPulsePanel
                liveSignals={liveSignals}
                totalShips={totalShips}
                streakDays={streakDays}
              />

              <div className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm p-4">
                <Achievements
                  currentLevel={currentLevel}
                  currentXp={currentXp}
                  currentStreak={streakDays}
                  totalShips={totalShips}
                />
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)] gap-6">
            <main className="space-y-6">
              <section className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm p-5 sm:p-6">
                <FeaturedProjects maxVisible={6} />
              </section>

              <section className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-white">
                      Latest Public Signals
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Recent updates, ships, and public movement from the network.
                  </p>
                </div>

                <div className="p-4 sm:p-5">
                  <ActivityFeed activities={publicActivities} />
                </div>
              </section>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-24 self-start">
              <NetworkPulsePanel
                liveSignals={liveSignals}
                totalShips={totalShips}
                streakDays={streakDays}
              />

              <div className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm p-4">
                <Achievements
                  currentLevel={currentLevel}
                  currentXp={currentXp}
                  currentStreak={streakDays}
                  totalShips={totalShips}
                />
              </div>

              <div className="hidden xl:block rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#111116]/80 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Discovery Mode
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Follow projects to keep their momentum visible.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] p-4">
                  <p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">
                    Look for projects with clear momentum, recent ships, and visible next moves. Those signals tell you where the network is alive.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        <div ref={loaderRef} className="w-full flex justify-center py-8">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              Calculating algorithmic updates...
            </div>
          ) : !hasMoreRef.current && feed.length > 0 ? (
            <p className="text-sm font-medium text-slate-400">You've caught up on everything!</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}"""

    source = source[:start] + new_return + source[end + len(end_marker):]

    required_after = [
        "max-w-7xl",
        "NetworkStatCard",
        "NetworkPulsePanel",
        "publicFeedItems",
        "Latest Public Signals",
        "Discovery Mode",
        "<FeaturedProjects maxVisible={6} />",
        "<TeamStories />",
        "<ActivityFeed activities={publicActivities} />",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[polish_discover_page_layout] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-discover-layout-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[polish_discover_page_layout] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[polish_discover_page_layout] patched: {TARGET}")

    print("")
    print("[polish_discover_page_layout] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"NetworkStatCard|NetworkPulsePanel|max-w-7xl|Shipping Now|Latest Public Signals|Discovery Mode|publicFeedItems\" src/pages/Discover.jsx -C 6")
    print("  git diff -- src/pages/Discover.jsx")


if __name__ == "__main__":
    main()

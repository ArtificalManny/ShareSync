from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

HELPERS_TO_INSERT = r"""
function getLatestTrendValue(trends, metric) {
  const rows = Array.isArray(trends?.data) ? trends.data : [];
  if (!rows.length) return 0;

  const latest = rows[rows.length - 1];
  const value = Number(latest?.[metric] || 0);

  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getTrendGrowthValue(trends, metric) {
  const value = Number(trends?.summary?.[`${metric}Growth`] || 0);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getStrongestGrowthMetric(trends) {
  const metrics = ["velocity", "quality", "collaboration", "overall"];

  return metrics
    .map((metric) => ({
      metric,
      latest: getLatestTrendValue(trends, metric),
      growth: getTrendGrowthValue(trends, metric),
    }))
    .sort((a, b) => b.latest - a.latest)[0];
}

function buildPerformanceInsight(trends) {
  const strongest = getStrongestGrowthMetric(trends);
  const collaboration = getLatestTrendValue(trends, "collaboration");
  const overall = getLatestTrendValue(trends, "overall");

  if (!strongest) {
    return "Your growth profile will become more useful as OpenShare collects more completed work, collaboration, and project activity.";
  }

  if (collaboration === 0 && overall > 0) {
    return "Your execution signal is active. Collaboration will rise once shared tasks, comments, discussions, and team interactions are captured.";
  }

  if (strongest.metric === "velocity") {
    return "Velocity is currently your strongest signal — the profile is reading you as someone who ships and completes work consistently.";
  }

  if (strongest.metric === "quality") {
    return "Quality is currently your strongest signal — the profile is reading stronger priority impact and completion quality.";
  }

  if (strongest.metric === "collaboration") {
    return "Collaboration is currently your strongest signal — the profile is detecting meaningful shared work and team interaction.";
  }

  return "Overall performance is stabilizing. The chart is now combining velocity, quality, and collaboration into one directional profile score.";
}
"""

OLD_TREND_BLOCK = """        {/* Trend Charts - Full Width */}
        {isOwnProfile && (
          <div className="col-span-12">
            <TrendCharts trends={trends} loading={growthLoading} />
          </div>
        )}"""

NEW_TREND_BLOCK = """        {/* Trend Charts - Full Width */}
        {isOwnProfile && (
          <section className="col-span-12 mt-2">
            <div
              className="
                relative overflow-hidden rounded-[2rem]
                border border-slate-200/80 dark:border-white/[0.08]
                bg-white/80 dark:bg-[#151518]/90
                shadow-[0_24px_70px_rgba(15,23,42,0.08)]
                dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]
              "
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
              <div className="pointer-events-none absolute -top-28 right-16 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 left-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative px-6 py-6 lg:px-8 lg:py-7 border-b border-slate-200/70 dark:border-white/[0.06]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                      <Activity className="h-3.5 w-3.5" />
                      Performance Intelligence
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Growth signal over time
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                      A 12-week readout of velocity, quality, collaboration, and overall execution strength.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] lg:max-w-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                      Current read
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-zinc-300">
                      {buildPerformanceInsight(trends)}
                    </p>
                  </div>
                </div>

                {getLatestTrendValue(trends, "collaboration") === 0 && (
                  <div className="mt-5 rounded-2xl border border-cyan-200/80 bg-cyan-50/70 px-4 py-3 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          Collaboration is waiting for stronger shared-work signals.
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                          Comments, discussion posts, assigned work from other members, and multi-person project activity will raise this score as those events are captured.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative p-4 lg:p-6">
                <TrendCharts
                  trends={trends}
                  loading={growthLoading}
                  className="profile-growth-trends"
                />
              </div>
            </div>
          </section>
        )}"""

def fail(message):
    print(f"\n[polish_profile_growth_section] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[polish_profile_growth_section] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "useGrowthTrack(userId)",
        "<TrendCharts trends={trends} loading={growthLoading} />",
        "function readAvatarOverride()",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "function buildPerformanceInsight" not in source:
        anchor = """function readAvatarOverride() {
  try {
    return localStorage.getItem("ss.avatarOverride") || null;
  } catch {
    return null;
  }
}
"""
        if anchor not in source:
            fail("Could not find readAvatarOverride helper anchor. No changes were written.")

        source = source.replace(anchor, anchor + HELPERS_TO_INSERT, 1)
        print("[polish_profile_growth_section] inserted performance insight helpers")
    else:
        print("[polish_profile_growth_section] performance insight helpers already present")

    if OLD_TREND_BLOCK in source:
        source = source.replace(OLD_TREND_BLOCK, NEW_TREND_BLOCK, 1)
        print("[polish_profile_growth_section] replaced TrendCharts wrapper with polished section")
    elif "Performance Intelligence" in source and "buildPerformanceInsight(trends)" in source:
        print("[polish_profile_growth_section] polished TrendCharts section already appears present")
    else:
        fail("Could not find exact TrendCharts block. No changes were written.")

    required_after = [
        "function buildPerformanceInsight",
        "Performance Intelligence",
        "Growth signal over time",
        "buildPerformanceInsight(trends)",
        "getLatestTrendValue(trends, \"collaboration\") === 0",
        "profile-growth-trends",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[polish_profile_growth_section] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-growth-section-polish")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[polish_profile_growth_section] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[polish_profile_growth_section] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Performance Intelligence|Growth signal over time|buildPerformanceInsight|profile-growth-trends|collaboration\\\"\\) === 0\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

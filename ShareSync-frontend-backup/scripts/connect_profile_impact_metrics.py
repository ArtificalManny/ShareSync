from pathlib import Path
import re
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

IMPACT_HELPERS = r"""
const getImpactMetricsSnapshot = (skillProfile, user) => {
  const impact = skillProfile?.impactMetrics || {};

  return {
    deployments: Number(
      impact.deployments ??
      impact.ships ??
      skillProfile?.completedTasks ??
      user?.totalShips ??
      user?.completedTasks ??
      0
    ),
    momentumDays: Number(
      impact.momentumDays ??
      user?.currentStreak ??
      user?.streakDays ??
      0
    ),
    growthPercent: Number(
      impact.growthPercent ??
      skillProfile?.overallGrowth ??
      0
    ),
    source: skillProfile?.impactMetrics ? "Live analytics" : "Profile fallback",
  };
};
"""

IMPACT_VARS = """  const impactMetrics = useMemo(
    () => getImpactMetricsSnapshot(skillProfile, user),
    [skillProfile, user]
  );
"""

OLD_BLOCK = """          {/* Impact Metrics */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Impact Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={user?.totalShips || 0} label="Deployments" color="text-slate-800 dark:text-white" />
              <StatCard value={`${user?.currentStreak || 0}d`} label="Momentum" gradient />
            </div>
            {skillProfile?.overallGrowth && (
              <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                    +{skillProfile.overallGrowth}% growth this quarter
                  </span>
                </div>
              </div>
            )}
          </div>"""

NEW_BLOCK = """          {/* Impact Metrics */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Impact Metrics</h3>
              </div>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                {growthLoading ? "Refreshing" : impactMetrics.source}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={impactMetrics.deployments || 0} label="Deployments" color="text-slate-800 dark:text-white" />
              <StatCard value={`${impactMetrics.momentumDays || 0}d`} label="Momentum" gradient />
            </div>

            <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  {impactMetrics.growthPercent >= 0 ? "+" : ""}{impactMetrics.growthPercent || 0}% recent growth
                </span>
              </div>
            </div>
          </div>"""

def fail(message):
    print(f"\n[connect_profile_impact_metrics] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[connect_profile_impact_metrics] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile",
        "useGrowthTrack(userId)",
        "{/* Impact Metrics */}",
        "StatCard value={user?.totalShips || 0}",
        "skillProfile?.overallGrowth",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing marker before patch: {marker}. No changes were written.")

    if "getImpactMetricsSnapshot" in source and "impactMetrics.deployments" in source:
        print("[connect_profile_impact_metrics] Impact Metrics already appears connected")
        return

    if "const getImpactMetricsSnapshot" not in source:
        calc_pattern = re.compile(
            r"(const calculateReliability = \(completed, total\) =>\s*\n\s*!total \|\| total === 0 \? 0 : Math\.round\(\(completed / total\) \* 100\);\s*\n)",
            re.MULTILINE,
        )
        source, count = calc_pattern.subn(lambda m: m.group(1) + IMPACT_HELPERS, source, count=1)
        if count != 1:
            fail("Could not insert impact helpers. No changes were written.")

    if "const impactMetrics = useMemo(" not in source:
        hook_pattern = re.compile(
            r"(\s*const\s*\{\s*skillProfile,\s*evolution,\s*suggestions,\s*trends,\s*loading:\s*growthLoading\s*\}\s*=\s*useGrowthTrack\(userId\);\s*\n)",
            re.MULTILINE,
        )
        source, count = hook_pattern.subn(lambda m: m.group(1) + IMPACT_VARS, source, count=1)
        if count != 1:
            fail("Could not insert impactMetrics derived state. No changes were written.")

    if OLD_BLOCK not in source:
        fail("Could not find exact Impact Metrics block. No changes were written.")

    source = source.replace(OLD_BLOCK, NEW_BLOCK, 1)

    required_after = [
        "const getImpactMetricsSnapshot",
        "const impactMetrics = useMemo(",
        "impactMetrics.deployments",
        "impactMetrics.momentumDays",
        "impactMetrics.growthPercent",
        "impactMetrics.source",
        "recent growth",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-impact-metrics")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[connect_profile_impact_metrics] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[connect_profile_impact_metrics] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getImpactMetricsSnapshot|impactMetrics|recent growth|Deployments|Momentum\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

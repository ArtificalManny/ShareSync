from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

HELPERS_TO_INSERT = r"""
const clampProfileScore = (value) => {
  const next = Number(value || 0);

  if (!Number.isFinite(next)) return 0;

  return Math.max(0, Math.min(100, Math.round(next)));
};

const getOperationalTrustScore = (skillProfile, fallbackReliability) => {
  const backendReliability = skillProfile?.skills?.reliability;

  if (backendReliability !== undefined && backendReliability !== null) {
    return clampProfileScore(backendReliability);
  }

  return clampProfileScore(fallbackReliability);
};

const getOperationalTrustLabel = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Good";
  if (score > 0) return "Building";
  return "Warming Up";
};

const getOperationalTrustDescription = (score) => {
  if (score >= 85) return "Dependable execution signal";
  if (score >= 70) return "Strong follow-through pattern";
  if (score >= 40) return "Reliability profile developing";
  if (score > 0) return "Early trust signal detected";
  return "Complete work to build trust data";
};
"""

OLD_CALC_HELPER = """const calculateReliability = (completed, total) =>
  !total || total === 0 ? 0 : Math.round((completed / total) * 100);
"""

NEW_CALC_HELPER = OLD_CALC_HELPER + HELPERS_TO_INSERT

OLD_STATE_BLOCK = """  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const reliability = calculateReliability(user?.completedTasks, user?.totalTasks);
  const userId = user?._id || user?.id;
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const name = useMemo(() => resolveUserName(user), [user]);
"""

NEW_STATE_BLOCK = """  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const fallbackReliability = calculateReliability(user?.completedTasks, user?.totalTasks);
  const userId = user?._id || user?.id;
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const operationalTrust = getOperationalTrustScore(skillProfile, fallbackReliability);
  const operationalTrustLabel = getOperationalTrustLabel(operationalTrust);
  const operationalTrustDescription = getOperationalTrustDescription(operationalTrust);
  const operationalTrustSource = skillProfile?.skills?.reliability !== undefined && skillProfile?.skills?.reliability !== null
    ? "Live analytics"
    : "Profile fallback";
  const name = useMemo(() => resolveUserName(user), [user]);
"""

OLD_OPERATIONAL_TRUST_BLOCK = """          {/* Operational Trust - with Ocean gradient bar */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-semibold text-slate-800 dark:text-white">{reliability}%</span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">
                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Good" : "Building"}
              </span>
            </div>
            <SkillBar value={reliability} />
          </div>"""

NEW_OPERATIONAL_TRUST_BLOCK = """          {/* Operational Trust - with Ocean gradient bar */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                {operationalTrustSource}
              </span>
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-semibold text-slate-800 dark:text-white">{operationalTrust}%</span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">
                {operationalTrustLabel}
              </span>
            </div>

            <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-zinc-500">
              {operationalTrustDescription}
            </p>

            <SkillBar value={operationalTrust} />

            {growthLoading && (
              <p className="mt-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                Refreshing trust signal...
              </p>
            )}
          </div>"""

def fail(message):
    print(f"\\n[patch_profile_operational_trust_growth_track] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_profile_operational_trust_growth_track] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "const calculateReliability",
        "useGrowthTrack(userId)",
        "{/* Operational Trust - with Ocean gradient bar */}",
        "<SkillBar value={reliability} />",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "getOperationalTrustScore" in source and "<SkillBar value={operationalTrust} />" in source:
        print("[patch_profile_operational_trust_growth_track] Operational Trust already appears Growth Track aligned")
        return

    if OLD_CALC_HELPER not in source:
        fail("Could not find calculateReliability helper block. No changes were written.")

    if OLD_STATE_BLOCK not in source:
        fail("Could not find Profile state/data block. No changes were written.")

    if OLD_OPERATIONAL_TRUST_BLOCK not in source:
        fail("Could not find exact Operational Trust block. No changes were written.")

    source = source.replace(OLD_CALC_HELPER, NEW_CALC_HELPER, 1)
    source = source.replace(OLD_STATE_BLOCK, NEW_STATE_BLOCK, 1)
    source = source.replace(OLD_OPERATIONAL_TRUST_BLOCK, NEW_OPERATIONAL_TRUST_BLOCK, 1)

    required_after = [
        "const getOperationalTrustScore",
        "const operationalTrust = getOperationalTrustScore(skillProfile, fallbackReliability);",
        "const operationalTrustLabel = getOperationalTrustLabel(operationalTrust);",
        "const operationalTrustDescription = getOperationalTrustDescription(operationalTrust);",
        "const operationalTrustSource = skillProfile?.skills?.reliability",
        "{operationalTrust}%",
        "<SkillBar value={operationalTrust} />",
        "Refreshing trust signal...",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[patch_profile_operational_trust_growth_track] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-operational-trust-growth-track")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_profile_operational_trust_growth_track] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[patch_profile_operational_trust_growth_track] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getOperationalTrustScore|operationalTrust|Live analytics|Profile fallback|Refreshing trust signal|SkillBar value=\\{operationalTrust\\}\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

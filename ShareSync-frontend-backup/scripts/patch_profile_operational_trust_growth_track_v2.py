from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_CALC_HELPER = """const calculateReliability = (completed, total) =>
  !total || total === 0 ? 0 : Math.round((completed / total) * 100);
"""

HELPERS_TO_INSERT = """const calculateReliability = (completed, total) =>
  !total || total === 0 ? 0 : Math.round((completed / total) * 100);

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

OLD_HOOK_LINE = """  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const name = useMemo(() => resolveUserName(user), [user]);
"""

NEW_HOOK_LINE = """  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const operationalTrust = getOperationalTrustScore(skillProfile, reliability);
  const operationalTrustLabel = getOperationalTrustLabel(operationalTrust);
  const operationalTrustDescription = getOperationalTrustDescription(operationalTrust);
  const operationalTrustSource = skillProfile?.skills?.reliability !== undefined && skillProfile?.skills?.reliability !== null
    ? "Live analytics"
    : "Profile fallback";
  const name = useMemo(() => resolveUserName(user), [user]);
"""

def fail(message):
    print(f"\\n[patch_profile_operational_trust_growth_track_v2] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
      fail(f"Expected exactly one match for {label}, found {count}. No changes were written.")
    return source.replace(old, new, 1)

def main():
    print("[patch_profile_operational_trust_growth_track_v2] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "const calculateReliability",
        "const reliability = calculateReliability(user?.completedTasks, user?.totalTasks);",
        "useGrowthTrack(userId)",
        "{/* Operational Trust - with Ocean gradient bar */}",
        "{reliability}%",
        "<SkillBar value={reliability} />",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "getOperationalTrustScore" in source and "<SkillBar value={operationalTrust} />" in source:
        print("[patch_profile_operational_trust_growth_track_v2] Operational Trust already appears Growth Track aligned")
        return

    source = replace_once(source, OLD_CALC_HELPER, HELPERS_TO_INSERT, "calculateReliability helper")
    source = replace_once(source, OLD_HOOK_LINE, NEW_HOOK_LINE, "useGrowthTrack state block")

    source = source.replace(
        """            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
            </div>
""",
        """            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                {operationalTrustSource}
              </span>
            </div>
""",
        1
    )

    source = source.replace("{reliability}%", "{operationalTrust}%", 1)
    source = source.replace(
        """                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Good" : "Building"}""",
        """                {operationalTrustLabel}""",
        1
    )
    source = source.replace(
        """            <SkillBar value={reliability} />""",
        """            <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-zinc-500">
              {operationalTrustDescription}
            </p>

            <SkillBar value={operationalTrust} />

            {growthLoading && (
              <p className="mt-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                Refreshing trust signal...
              </p>
            )}""",
        1
    )

    required_after = [
        "const getOperationalTrustScore",
        "const operationalTrust = getOperationalTrustScore(skillProfile, reliability);",
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
        print("[patch_profile_operational_trust_growth_track_v2] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-operational-trust-growth-track-v2")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_profile_operational_trust_growth_track_v2] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[patch_profile_operational_trust_growth_track_v2] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getOperationalTrustScore|operationalTrust|Live analytics|Profile fallback|Refreshing trust signal|SkillBar value=\\{operationalTrust\\}\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

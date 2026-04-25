from pathlib import Path
import re
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

TRUST_VARS = """  const operationalTrust = getOperationalTrustScore(skillProfile, reliability);
  const operationalTrustLabel = getOperationalTrustLabel(operationalTrust);
  const operationalTrustDescription = getOperationalTrustDescription(operationalTrust);
  const operationalTrustSource = skillProfile?.skills?.reliability !== undefined && skillProfile?.skills?.reliability !== null
    ? "Live analytics"
    : "Profile fallback";
"""

def fail(message):
    print(f"\n[patch_profile_operational_trust_growth_track_v3] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_profile_operational_trust_growth_track_v3] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "const calculateReliability",
        "useGrowthTrack(userId)",
        "{/* Operational Trust - with Ocean gradient bar */}",
        "{reliability}%",
        "<SkillBar value={reliability} />",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "getOperationalTrustScore" in source and "<SkillBar value={operationalTrust} />" in source:
        print("[patch_profile_operational_trust_growth_track_v3] Operational Trust already appears Growth Track aligned")
        return

    # 1) Add helpers after calculateReliability helper if not present.
    if "const getOperationalTrustScore" not in source:
        helper_pattern = re.compile(
            r"const calculateReliability = \(completed, total\) =>\s*\n\s*!total \|\| total === 0 \? 0 : Math\.round\(\(completed / total\) \* 100\);\s*\n",
            re.MULTILINE,
        )
        source, helper_count = helper_pattern.subn(
            lambda match: match.group(0) + HELPERS_TO_INSERT,
            source,
            count=1,
        )
        if helper_count != 1:
            fail("Could not insert Operational Trust helpers after calculateReliability. No changes were written.")
        print("[patch_profile_operational_trust_growth_track_v3] inserted Operational Trust helpers")

    # 2) Insert operational trust variables after useGrowthTrack destructuring.
    if "const operationalTrust = getOperationalTrustScore" not in source:
        hook_pattern = re.compile(
            r"(\s*const\s*\{\s*skillProfile,\s*evolution,\s*suggestions,\s*trends,\s*loading:\s*growthLoading\s*\}\s*=\s*useGrowthTrack\(userId\);\s*\n)",
            re.MULTILINE,
        )
        source, hook_count = hook_pattern.subn(
            lambda match: match.group(1) + TRUST_VARS,
            source,
            count=1,
        )
        if hook_count != 1:
            fail("Could not find useGrowthTrack destructuring line. No changes were written.")
        print("[patch_profile_operational_trust_growth_track_v3] inserted Operational Trust variables")

    # 3) Upgrade Operational Trust header, but only if still in old form.
    old_header = """            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
            </div>
"""
    new_header = """            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                {operationalTrustSource}
              </span>
            </div>
"""
    if old_header in source and "operationalTrustSource" not in source[source.find("{/* Operational Trust - with Ocean gradient bar */}"):source.find("{/* ✅ Priority 1: Profile Strength */}")]:
        source = source.replace(old_header, new_header, 1)
        print("[patch_profile_operational_trust_growth_track_v3] upgraded Operational Trust header")

    # 4) Replace specific Operational Trust render values.
    source = source.replace("{reliability}%", "{operationalTrust}%", 1)

    label_pattern = re.compile(
        r"\{reliability\s*>=\s*70\s*\?\s*\"Excellent\"\s*:\s*reliability\s*>=\s*40\s*\?\s*\"Good\"\s*:\s*\"Building\"\}",
        re.MULTILINE,
    )
    source, label_count = label_pattern.subn("{operationalTrustLabel}", source, count=1)
    if label_count != 1 and "{operationalTrustLabel}" not in source:
        fail("Could not replace Operational Trust label expression. No changes were written.")

    old_skillbar = """            <SkillBar value={reliability} />"""
    new_skillbar = """            <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-zinc-500">
              {operationalTrustDescription}
            </p>

            <SkillBar value={operationalTrust} />

            {growthLoading && (
              <p className="mt-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                Refreshing trust signal...
              </p>
            )}"""
    if old_skillbar not in source:
        fail("Could not find old SkillBar reliability line. No changes were written.")
    source = source.replace(old_skillbar, new_skillbar, 1)

    required_after = [
        "const getOperationalTrustScore",
        "const operationalTrust = getOperationalTrustScore(skillProfile, reliability);",
        "const operationalTrustLabel = getOperationalTrustLabel(operationalTrust);",
        "const operationalTrustDescription = getOperationalTrustDescription(operationalTrust);",
        "const operationalTrustSource = skillProfile?.skills?.reliability",
        "{operationalTrust}%",
        "{operationalTrustLabel}",
        "<SkillBar value={operationalTrust} />",
        "Refreshing trust signal...",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[patch_profile_operational_trust_growth_track_v3] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-operational-trust-growth-track-v3")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_profile_operational_trust_growth_track_v3] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[patch_profile_operational_trust_growth_track_v3] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getOperationalTrustScore|operationalTrust|Live analytics|Profile fallback|Refreshing trust signal|SkillBar value=\\{operationalTrust\\}\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

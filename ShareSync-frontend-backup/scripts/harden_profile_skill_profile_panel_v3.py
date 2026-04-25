from pathlib import Path
import re
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

HELPERS_TO_INSERT = r"""
const normalizeSkillScore = (value) => {
  const next = Number(value || 0);

  if (!Number.isFinite(next)) return 0;

  return Math.max(0, Math.min(100, Math.round(next)));
};

const buildSkillProfileSnapshot = (skillProfile) => {
  if (!skillProfile?.skills || typeof skillProfile.skills !== "object") {
    return null;
  }

  const normalizedSkills = Object.entries(skillProfile.skills).reduce((acc, [key, value]) => {
    acc[key] = normalizeSkillScore(value);
    return acc;
  }, {});

  return {
    skills: normalizedSkills,
    strengths: Array.isArray(skillProfile.strengths) ? skillProfile.strengths : [],
    growthAreas: Array.isArray(skillProfile.growthAreas) ? skillProfile.growthAreas : [],
    archetype: skillProfile.archetype || null,
  };
};
"""

SKILL_PROFILE_VARS = """  const skillProfileSnapshot = useMemo(
    () => buildSkillProfileSnapshot(skillProfile),
    [skillProfile]
  );
  const skillProfileSource = skillProfileSnapshot ? "Live analytics" : "Warming up";
"""

NEW_SKILL_BLOCK = """          {/* Skill Profile - with radar chart */}
          {isOwnProfile && (skillProfileSnapshot || growthLoading) && (
            <div
              className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Skill Profile</h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-zinc-500">
                      Backend-calculated capability signals from your recent project activity.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em] bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                    {growthLoading ? "Refreshing" : skillProfileSource}
                  </span>

                  {skillProfileSnapshot?.strengths?.slice(0, 2).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[10px] bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 capitalize"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {skillProfileSnapshot?.skills ? (
                <>
                  <div className="flex justify-center">
                    <SkillRadarChart
                      skills={skillProfileSnapshot.skills}
                      size={280}
                      showLabels={true}
                      showValues={true}
                      showTrends={true}
                    />
                  </div>

                  {skillProfileSnapshot.growthAreas?.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Focus areas for growth:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillProfileSnapshot.growthAreas.map((area) => (
                          <span
                            key={area}
                            className="px-2 py-1 rounded-lg text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 capitalize"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-white/[0.14] dark:bg-white/[0.04]">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Brain className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                    Skill profile is warming up.
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-zinc-400">
                    Complete tasks, ship updates, and collaborate to generate radar-ready skill signals.
                  </p>
                </div>
              )}
            </div>
          )}
"""

def fail(message):
    print(f"\n[harden_profile_skill_profile_panel_v3] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[harden_profile_skill_profile_panel_v3] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "useGrowthTrack(userId)",
        "SkillRadarChart",
        "{/* Skill Profile - with radar chart */}",
        "{/* Behavioral Analysis */}",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "buildSkillProfileSnapshot" in source and "skills={skillProfileSnapshot.skills}" in source:
        print("[harden_profile_skill_profile_panel_v3] Skill Profile panel already appears hardened")
        return

    # 1) Insert helpers after calculateReliability if missing.
    if "const buildSkillProfileSnapshot" not in source:
        helper_pattern = re.compile(
            r"(const calculateReliability = \(completed, total\) =>\s*\n\s*!total \|\| total === 0 \? 0 : Math\.round\(\(completed / total\) \* 100\);\s*\n)",
            re.MULTILINE,
        )

        source, helper_count = helper_pattern.subn(
            lambda match: match.group(1) + HELPERS_TO_INSERT,
            source,
            count=1,
        )

        if helper_count != 1:
            fail("Could not insert Skill Profile helpers after calculateReliability. No changes were written.")

        print("[harden_profile_skill_profile_panel_v3] inserted Skill Profile helpers")

    # 2) Insert derived snapshot after useGrowthTrack destructuring if missing.
    if "const skillProfileSnapshot = useMemo(" not in source:
        hook_pattern = re.compile(
            r"(\s*const\s*\{\s*skillProfile,\s*evolution,\s*suggestions,\s*trends,\s*loading:\s*growthLoading\s*\}\s*=\s*useGrowthTrack\(userId\);\s*\n)",
            re.MULTILINE,
        )

        source, hook_count = hook_pattern.subn(
            lambda match: match.group(1) + SKILL_PROFILE_VARS,
            source,
            count=1,
        )

        if hook_count != 1:
            fail("Could not find useGrowthTrack destructuring line. No changes were written.")

        print("[harden_profile_skill_profile_panel_v3] inserted Skill Profile derived state")

    # 3) Replace Skill Profile block using anchors only.
    start = source.find("          {/* Skill Profile - with radar chart */}")
    end = source.find("          {/* Behavioral Analysis */}", start)

    if start == -1:
        fail("Could not find Skill Profile block start. No changes were written.")

    if end == -1 or end <= start:
        fail("Could not find Behavioral Analysis anchor after Skill Profile block. No changes were written.")

    source = source[:start] + NEW_SKILL_BLOCK + "\n\n" + source[end:]

    required_after = [
        "const normalizeSkillScore",
        "const buildSkillProfileSnapshot",
        "const skillProfileSnapshot = useMemo(",
        "const skillProfileSource = skillProfileSnapshot ?",
        "Backend-calculated capability signals",
        "skills={skillProfileSnapshot.skills}",
        "Skill profile is warming up.",
        "{growthLoading ? \"Refreshing\" : skillProfileSource}",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    # This only warns now because local formatting may vary.
    if "skills={skillProfile.skills}" in source:
        print("[harden_profile_skill_profile_panel_v3] warning: compact old binding still appears somewhere. Inspect git diff.")

    if source == original:
        print("[harden_profile_skill_profile_panel_v3] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-skill-profile-panel-v3")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[harden_profile_skill_profile_panel_v3] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[harden_profile_skill_profile_panel_v3] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"buildSkillProfileSnapshot|skillProfileSnapshot|Backend-calculated capability signals|Skill profile is warming up|skills=\\{skillProfileSnapshot\\.skills\\}\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

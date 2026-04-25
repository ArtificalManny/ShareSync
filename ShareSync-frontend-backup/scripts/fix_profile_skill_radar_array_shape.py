from pathlib import Path
import re
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_BUILD_FUNCTION = """const buildSkillProfileSnapshot = (skillProfile) => {
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

NEW_BUILD_FUNCTION = """const buildSkillProfileSnapshot = (skillProfile) => {
  const toPoint = (key, label, value) => ({
    key,
    label,
    name: label,
    value: normalizeSkillScore(value),
    score: normalizeSkillScore(value),
  });

  if (Array.isArray(skillProfile?.radar) && skillProfile.radar.length > 0) {
    return {
      skills: skillProfile.radar.map((point) =>
        toPoint(
          point.key || point.label || point.name,
          point.label || point.name || point.key,
          point.value ?? point.score
        )
      ),
      strengths: Array.isArray(skillProfile.strengths) ? skillProfile.strengths : [],
      growthAreas: Array.isArray(skillProfile.growthAreas) ? skillProfile.growthAreas : [],
      archetype: skillProfile.archetype || null,
    };
  }

  if (!skillProfile?.skills || typeof skillProfile.skills !== "object") {
    return null;
  }

  const rawSkills = skillProfile.skills;

  const radarSkills = [
    toPoint("velocity", "Velocity", rawSkills.velocity),
    toPoint("quality", "Quality", rawSkills.quality),
    toPoint("technical", "Technical", rawSkills.technical ?? rawSkills.execution),
    toPoint("communication", "Communication", rawSkills.communication ?? rawSkills.initiative),
    toPoint("collaboration", "Collaboration", rawSkills.collaboration),
    toPoint("leadership", "Leadership", rawSkills.leadership ?? rawSkills.consistency),
    toPoint("strategy", "Strategy", rawSkills.strategy ?? rawSkills.quality),
    toPoint("reliability", "Reliability", rawSkills.reliability),
  ].filter((point) => point.key && point.label);

  return {
    skills: radarSkills,
    strengths: Array.isArray(skillProfile.strengths) ? skillProfile.strengths : [],
    growthAreas: Array.isArray(skillProfile.growthAreas) ? skillProfile.growthAreas : [],
    archetype: skillProfile.archetype || null,
  };
};
"""

def fail(message):
    print(f"\\n[fix_profile_skill_radar_array_shape] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[fix_profile_skill_radar_array_shape] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "const buildSkillProfileSnapshot",
        "SkillRadarChart",
        "skills={skillProfileSnapshot.skills}",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "const toPoint = (key, label, value)" in source and "Array.isArray(skillProfile?.radar)" in source:
        print("[fix_profile_skill_radar_array_shape] Skill radar array shape already appears fixed")
        return

    if OLD_BUILD_FUNCTION not in source:
        fail("Could not find exact buildSkillProfileSnapshot function. No changes were written.")

    source = source.replace(OLD_BUILD_FUNCTION, NEW_BUILD_FUNCTION, 1)

    required_after = [
        "const toPoint = (key, label, value)",
        "Array.isArray(skillProfile?.radar)",
        "skillProfile.radar.map",
        "toPoint(\"velocity\", \"Velocity\", rawSkills.velocity)",
        "toPoint(\"reliability\", \"Reliability\", rawSkills.reliability)",
        "skills: radarSkills",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[fix_profile_skill_radar_array_shape] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-skill-radar-array-shape")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[fix_profile_skill_radar_array_shape] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[fix_profile_skill_radar_array_shape] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"toPoint|Array.isArray\\(skillProfile\\?\\.radar\\)|radarSkills|skills=\\{skillProfileSnapshot\\.skills\\}\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()

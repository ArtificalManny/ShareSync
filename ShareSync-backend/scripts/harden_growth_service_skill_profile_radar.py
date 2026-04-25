from pathlib import Path
import sys

ROOT = Path.cwd()
GROWTH_SERVICE = ROOT / "src/analytics/growth.service.ts"

def fail(message):
    print(f"\n[harden_growth_service_skill_profile_radar] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[harden_growth_service_skill_profile_radar] starting")

    if not GROWTH_SERVICE.exists():
        fail(f"Could not find {GROWTH_SERVICE}")

    source = GROWTH_SERVICE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class GrowthService",
        "async getSkillProfile",
        "const velocity",
        "const execution",
        "const quality",
        "const consistency",
        "const collaboration",
        "const initiative",
        "const skills =",
        "private determineArchetype",
        "private emptySkillProfile",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "const radar = this.buildSkillRadar(" in source and "private buildSkillRadar(" in source:
        print("[harden_growth_service_skill_profile_radar] Skill Profile radar backend already appears hardened")
        return

    old_skills_block = """      const skills = { velocity, execution, quality, consistency, reliability, collaboration, initiative };

      // Identify strengths and growth areas
      const entries = Object.entries(skills).sort(([, a], [, b]) => b - a);
      const strengths = entries.slice(0, 2).map(([k]) => k);
      const growthAreas = entries.slice(-2).map(([k]) => k);
"""

    fallback_old_skills_block = """      const skills = { velocity, execution, quality, consistency, collaboration, initiative };

      // Identify strengths and growth areas
      const entries = Object.entries(skills).sort(([, a], [, b]) => b - a);
      const strengths = entries.slice(0, 2).map(([k]) => k);
      const growthAreas = entries.slice(-2).map(([k]) => k);
"""

    new_skills_block = """      const technical = this.clampScore((quality * 0.55) + (execution * 0.25) + (velocity * 0.20));
      const communication = this.clampScore((collaboration * 0.60) + (initiative * 0.25) + (consistency * 0.15));
      const leadership = this.clampScore((initiative * 0.45) + (reliability * 0.30) + (collaboration * 0.25));
      const strategy = this.clampScore((quality * 0.45) + (initiative * 0.25) + (execution * 0.20) + (reliability * 0.10));

      const skills = {
        velocity,
        execution,
        quality,
        consistency,
        reliability,
        collaboration,
        initiative,
        technical,
        communication,
        leadership,
        strategy,
      };

      const radar = this.buildSkillRadar(skills);
      const skillDimensions = radar.reduce((acc, point) => {
        acc[point.key] = point.value;
        return acc;
      }, {} as Record<string, number>);

      // Identify strengths and growth areas from display-ready radar dimensions.
      const entries = radar
        .map((point) => [point.label, point.value] as [string, number])
        .sort(([, a], [, b]) => b - a);

      const strengths = entries.slice(0, 2).map(([label]) => label);
      const growthAreas = entries.slice(-2).map(([label]) => label);
"""

    if old_skills_block in source:
        source = source.replace(old_skills_block, new_skills_block, 1)
        print("[harden_growth_service_skill_profile_radar] replaced reliability-aware skills block")
    elif fallback_old_skills_block in source:
        source = source.replace(fallback_old_skills_block, new_skills_block, 1)
        print("[harden_growth_service_skill_profile_radar] replaced legacy skills block")
    else:
        fail("Could not find exact skills/strengths/growthAreas block. No changes were written.")

    old_return_fragment = """        skills,
        strengths,
        growthAreas,
        overallGrowth,
"""

    new_return_fragment = """        skills,
        radar,
        skillDimensions,
        strengths,
        growthAreas,
        overallGrowth,
"""

    if old_return_fragment in source and "        radar,\n        skillDimensions," not in source:
        source = source.replace(old_return_fragment, new_return_fragment, 1)
        print("[harden_growth_service_skill_profile_radar] added radar and skillDimensions to getSkillProfile response")
    elif "        radar,\n        skillDimensions," in source:
        print("[harden_growth_service_skill_profile_radar] response already includes radar and skillDimensions")
    else:
        fail("Could not find getSkillProfile return fragment. No changes were written.")

    helper_anchor = "  private determineArchetype(skills: Record<string, number>): string {"
    helper_code = """  private buildSkillRadar(skills: Record<string, number>) {
    const dimensions = [
      { key: 'velocity', label: 'Velocity', value: skills.velocity },
      { key: 'quality', label: 'Quality', value: skills.quality },
      { key: 'technical', label: 'Technical', value: skills.technical },
      { key: 'communication', label: 'Communication', value: skills.communication },
      { key: 'collaboration', label: 'Collaboration', value: skills.collaboration },
      { key: 'leadership', label: 'Leadership', value: skills.leadership },
      { key: 'strategy', label: 'Strategy', value: skills.strategy },
      { key: 'reliability', label: 'Reliability', value: skills.reliability },
    ];

    return dimensions.map((dimension) => ({
      ...dimension,
      value: this.clampScore(Number(dimension.value || 0)),
    }));
  }

"""

    if "private buildSkillRadar(" not in source:
        if helper_anchor not in source:
            fail("Could not find determineArchetype anchor. No changes were written.")
        source = source.replace(helper_anchor, helper_code + helper_anchor, 1)
        print("[harden_growth_service_skill_profile_radar] inserted buildSkillRadar helper")

    old_destructure = "    const { velocity, execution, quality, consistency, collaboration, initiative } = skills;"
    new_destructure = "    const { velocity, execution, quality, consistency, reliability = 0, collaboration, initiative } = skills;"

    if old_destructure in source:
        source = source.replace(old_destructure, new_destructure, 1)
        print("[harden_growth_service_skill_profile_radar] added reliability to determineArchetype destructuring")

    old_machine_rule = "    if (consistency >= 70 && velocity >= 50) return 'The Machine';"
    new_machine_rule = "    if (reliability >= 75 && consistency >= 60) return 'The Operator';\n    if (consistency >= 70 && velocity >= 50) return 'The Machine';"

    if old_machine_rule in source and "return 'The Operator';" not in source:
        source = source.replace(old_machine_rule, new_machine_rule, 1)
        print("[harden_growth_service_skill_profile_radar] added Operator archetype rule")

    old_empty = """  private emptySkillProfile() {
    return {
      skills: { velocity: 0, execution: 0, quality: 0, consistency: 0, collaboration: 0, initiative: 0 },
      strengths: [],
      growthAreas: [],
      overallGrowth: 0,
      archetype: { current: 'The Explorer' },
      totalTasks: 0,
      completedTasks: 0,
      activeDaysLast14: 0,
    };
  }
"""

    new_empty = """  private emptySkillProfile() {
    const skills = {
      velocity: 0,
      execution: 0,
      quality: 0,
      consistency: 0,
      reliability: 0,
      collaboration: 0,
      initiative: 0,
      technical: 0,
      communication: 0,
      leadership: 0,
      strategy: 0,
    };

    const radar = this.buildSkillRadar(skills);
    const skillDimensions = radar.reduce((acc, point) => {
      acc[point.key] = point.value;
      return acc;
    }, {} as Record<string, number>);

    return {
      skills,
      radar,
      skillDimensions,
      strengths: [],
      growthAreas: [],
      overallGrowth: 0,
      archetype: { current: 'The Explorer' },
      totalTasks: 0,
      completedTasks: 0,
      activeDaysLast14: 0,
    };
  }
"""

    if old_empty in source:
        source = source.replace(old_empty, new_empty, 1)
        print("[harden_growth_service_skill_profile_radar] replaced emptySkillProfile")
    elif "const skills = {\n      velocity: 0," in source and "const radar = this.buildSkillRadar(skills);" in source:
        print("[harden_growth_service_skill_profile_radar] emptySkillProfile already appears upgraded")
    else:
        print("[harden_growth_service_skill_profile_radar] warning: emptySkillProfile was not replaced. Inspect manually.")

    required_after = [
        "const technical = this.clampScore",
        "const communication = this.clampScore",
        "const leadership = this.clampScore",
        "const strategy = this.clampScore",
        "const radar = this.buildSkillRadar(skills);",
        "const skillDimensions = radar.reduce",
        "private buildSkillRadar(",
        "label: 'Technical'",
        "label: 'Communication'",
        "label: 'Leadership'",
        "label: 'Strategy'",
        "radar,",
        "skillDimensions,",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[harden_growth_service_skill_profile_radar] no changes needed")
        return

    backup = GROWTH_SERVICE.with_suffix(GROWTH_SERVICE.suffix + ".bak-skill-profile-radar")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[harden_growth_service_skill_profile_radar] backup created: {backup}")

    GROWTH_SERVICE.write_text(source, encoding="utf-8")
    print(f"[harden_growth_service_skill_profile_radar] patched: {GROWTH_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"buildSkillRadar|skillDimensions|technical|communication|leadership|strategy|label: 'Reliability'|The Operator|emptySkillProfile\" src/analytics/growth.service.ts")
    print("  git diff -- src/analytics/growth.service.ts")

if __name__ == "__main__":
    main()

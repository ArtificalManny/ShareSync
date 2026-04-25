from pathlib import Path
import sys

ROOT = Path.cwd()
GROWTH_SERVICE = ROOT / "src/analytics/growth.service.ts"

def fail(message):
    print(f"\n[add_growth_impact_metrics] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[add_growth_impact_metrics] starting")

    if not GROWTH_SERVICE.exists():
        fail(f"Could not find {GROWTH_SERVICE}")

    source = GROWTH_SERVICE.read_text(encoding="utf-8")
    original = source

    required = [
        "async getSkillProfile",
        "const streak = Number(user?.streakDays || user?.currentStreak || 0);",
        "const overallGrowth = priorTwoWeeks > 0",
        "completedTasks,",
        "activeDaysLast14: activeDays,",
        "private emptySkillProfile()",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing marker before patch: {marker}. No changes were written.")

    if "const impactMetrics = {" in source and "impactMetrics," in source:
        print("[add_growth_impact_metrics] impactMetrics already appears present")
        return

    old_growth_block = """      const overallGrowth = priorTwoWeeks > 0
        ? Math.round(((recentTwoWeeks - priorTwoWeeks) / priorTwoWeeks) * 100)
        : recentTwoWeeks > 0 ? 100 : 0;

      // Archetype
"""

    new_growth_block = """      const overallGrowth = priorTwoWeeks > 0
        ? Math.round(((recentTwoWeeks - priorTwoWeeks) / priorTwoWeeks) * 100)
        : recentTwoWeeks > 0 ? 100 : 0;

      const impactMetrics = {
        deployments: completedTasks,
        ships: completedTasks,
        momentumDays: streak,
        activeDaysLast14: activeDays,
        growthPercent: overallGrowth,
        growthLabel: 'recent growth',
      };

      // Archetype
"""

    if old_growth_block not in source:
        fail("Could not find overallGrowth block. No changes were written.")

    source = source.replace(old_growth_block, new_growth_block, 1)

    old_return = """        overallGrowth,
        archetype: { current: archetype },
        totalTasks,
        completedTasks,
        activeDaysLast14: activeDays,
"""

    new_return = """        overallGrowth,
        impactMetrics,
        archetype: { current: archetype },
        totalTasks,
        completedTasks,
        activeDaysLast14: activeDays,
"""

    if old_return not in source:
        fail("Could not find getSkillProfile return block. No changes were written.")

    source = source.replace(old_return, new_return, 1)

    old_empty = """      overallGrowth: 0,
      archetype: { current: 'The Explorer' },
      totalTasks: 0,
      completedTasks: 0,
      activeDaysLast14: 0,
"""

    new_empty = """      overallGrowth: 0,
      impactMetrics: {
        deployments: 0,
        ships: 0,
        momentumDays: 0,
        activeDaysLast14: 0,
        growthPercent: 0,
        growthLabel: 'recent growth',
      },
      archetype: { current: 'The Explorer' },
      totalTasks: 0,
      completedTasks: 0,
      activeDaysLast14: 0,
"""

    if old_empty not in source:
        fail("Could not find emptySkillProfile return block. No changes were written.")

    source = source.replace(old_empty, new_empty, 1)

    required_after = [
        "const impactMetrics = {",
        "deployments: completedTasks",
        "momentumDays: streak",
        "growthPercent: overallGrowth",
        "impactMetrics,",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = GROWTH_SERVICE.with_suffix(GROWTH_SERVICE.suffix + ".bak-impact-metrics")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[add_growth_impact_metrics] backup created: {backup}")

    GROWTH_SERVICE.write_text(source, encoding="utf-8")
    print(f"[add_growth_impact_metrics] patched: {GROWTH_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"impactMetrics|deployments|momentumDays|growthPercent|growthLabel\" src/analytics/growth.service.ts")
    print("  git diff -- src/analytics/growth.service.ts")

if __name__ == "__main__":
    main()

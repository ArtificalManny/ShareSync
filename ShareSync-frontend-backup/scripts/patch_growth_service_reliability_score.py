from pathlib import Path
import re
import sys

ROOT = Path.cwd()
GROWTH_SERVICE = ROOT / "src/analytics/growth.service.ts"

def fail(message):
    print(f"\n[patch_growth_service_reliability_score] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_growth_service_reliability_score] starting")

    if not GROWTH_SERVICE.exists():
        fail(f"Could not find {GROWTH_SERVICE}")

    source = GROWTH_SERVICE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class GrowthService",
        "async getSkillProfile",
        "const allTasks = await this.taskModel.find",
        "const consistency = Math.min(100, Math.round((activeDays / 14) * 100));",
        "const skills = { velocity, execution, quality, consistency, collaboration, initiative };",
        "private emptySkillProfile()",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "const reliability = this.calculateReliabilityScore" in source and "reliability: 0" in source:
        print("[patch_growth_service_reliability_score] reliability already appears patched")
        return

    # 1) Include dueDate/assignee-style fields in the skill-profile query.
    old_select = ".select('status priority completedAt createdAt comments tags').lean();"
    new_select = ".select('status priority completedAt createdAt dueDate comments tags createdBy userId completedBy assigneeId').lean();"

    if old_select in source:
        source = source.replace(old_select, new_select, 1)
        print("[patch_growth_service_reliability_score] expanded getSkillProfile task select fields")
    elif new_select in source:
        print("[patch_growth_service_reliability_score] task select fields already expanded")
    else:
        fail("Could not find getSkillProfile select field line. No changes were written.")

    # 2) Add user streak lookup after allTasks query.
    all_tasks_line = """      const allTasks = await this.taskModel.find({
        $or: [{ completedBy: uid }, { createdBy: uid }, { userId: uid }, { assigneeId: uid }],
      }).select('status priority completedAt createdAt dueDate comments tags createdBy userId completedBy assigneeId').lean();

"""
    user_lookup = """      const user: any = await this.userModel
        .findById(uid)
        .select('streakDays currentStreak')
        .lean();

"""

    if user_lookup not in source:
        if all_tasks_line not in source:
            fail("Could not find expanded allTasks query block for user lookup insertion. No changes were written.")
        source = source.replace(all_tasks_line, all_tasks_line + user_lookup, 1)
        print("[patch_growth_service_reliability_score] added user streak lookup")

    # 3) Insert reliability formula after consistency calculation.
    consistency_line = "      const consistency = Math.min(100, Math.round((activeDays / 14) * 100));\n"
    reliability_block = """
      // Reliability: dependable follow-through based on completion rate, consistency, streak, and due-date performance.
      const streak = Number(user?.streakDays || user?.currentStreak || 0);
      const reliability = this.calculateReliabilityScore({
        totalTasks,
        completedTasks,
        execution,
        consistency,
        streak,
        allTasks,
      });
"""

    if "const reliability = this.calculateReliabilityScore" not in source:
        if consistency_line not in source:
            fail("Could not find consistency line for reliability insertion. No changes were written.")
        source = source.replace(consistency_line, consistency_line + reliability_block, 1)
        print("[patch_growth_service_reliability_score] inserted reliability score calculation")

    # 4) Add reliability to the skills object.
    old_skills = "      const skills = { velocity, execution, quality, consistency, collaboration, initiative };"
    new_skills = "      const skills = { velocity, execution, quality, consistency, reliability, collaboration, initiative };"

    if old_skills in source:
        source = source.replace(old_skills, new_skills, 1)
        print("[patch_growth_service_reliability_score] added reliability to skills object")
    elif new_skills in source:
        print("[patch_growth_service_reliability_score] skills object already includes reliability")
    else:
        fail("Could not find skills object line. No changes were written.")

    # 5) Add helper method before determineArchetype.
    helper_anchor = "  private determineArchetype(skills: Record<string, number>): string {"
    helper_code = """  private calculateReliabilityScore(input: {
    totalTasks: number;
    completedTasks: number;
    execution: number;
    consistency: number;
    streak: number;
    allTasks: any[];
  }): number {
    const { totalTasks, completedTasks, execution, consistency, streak, allTasks } = input;

    if (totalTasks <= 0) {
      return 0;
    }

    const completedWithDates = allTasks.filter((task) =>
      task?.completedAt && ['done', 'completed', 'Done', 'Completed'].includes(task?.status),
    );

    const tasksWithDueDates = completedWithDates.filter((task) => task?.dueDate);

    const onTimeScore = tasksWithDueDates.length > 0
      ? this.clampScore(
          Math.round(
            (tasksWithDueDates.filter((task) => {
              const completedAt = new Date(task.completedAt).getTime();
              const dueDate = new Date(task.dueDate).getTime();

              if (!Number.isFinite(completedAt) || !Number.isFinite(dueDate)) {
                return false;
              }

              return completedAt <= dueDate;
            }).length / tasksWithDueDates.length) * 100,
          ),
        )
      : null;

    const volumeSignal = this.clampScore(completedTasks * 8);
    const streakSignal = this.clampScore(streak * 8);

    if (onTimeScore !== null) {
      return this.clampScore(
        (execution * 0.35) +
        (consistency * 0.25) +
        (onTimeScore * 0.25) +
        (streakSignal * 0.15),
      );
    }

    return this.clampScore(
      (execution * 0.4) +
      (consistency * 0.25) +
      (volumeSignal * 0.2) +
      (streakSignal * 0.15),
    );
  }

"""

    if "private calculateReliabilityScore(" not in source:
        if helper_anchor not in source:
            fail("Could not find determineArchetype anchor for reliability helper insertion. No changes were written.")
        source = source.replace(helper_anchor, helper_code + helper_anchor, 1)
        print("[patch_growth_service_reliability_score] inserted calculateReliabilityScore helper")

    # 6) Make determineArchetype aware of reliability without requiring it.
    old_destructure = "    const { velocity, execution, quality, consistency, collaboration, initiative } = skills;"
    new_destructure = "    const { velocity, execution, quality, consistency, reliability = 0, collaboration, initiative } = skills;"

    if old_destructure in source:
        source = source.replace(old_destructure, new_destructure, 1)
        print("[patch_growth_service_reliability_score] added reliability to archetype destructuring")

    old_machine_rule = "    if (consistency >= 70 && velocity >= 50) return 'The Machine';"
    new_machine_rule = "    if (reliability >= 75 && consistency >= 60) return 'The Operator';\n    if (consistency >= 70 && velocity >= 50) return 'The Machine';"

    if old_machine_rule in source and "return 'The Operator';" not in source:
        source = source.replace(old_machine_rule, new_machine_rule, 1)
        print("[patch_growth_service_reliability_score] added Operator archetype rule")

    # 7) Add reliability to emptySkillProfile.
    old_empty = "      skills: { velocity: 0, execution: 0, quality: 0, consistency: 0, collaboration: 0, initiative: 0 },"
    new_empty = "      skills: { velocity: 0, execution: 0, quality: 0, consistency: 0, reliability: 0, collaboration: 0, initiative: 0 },"

    if old_empty in source:
        source = source.replace(old_empty, new_empty, 1)
        print("[patch_growth_service_reliability_score] added reliability to emptySkillProfile")
    elif new_empty in source:
        print("[patch_growth_service_reliability_score] emptySkillProfile already includes reliability")
    else:
        fail("Could not find emptySkillProfile skills object. No changes were written.")

    required_after = [
        "const reliability = this.calculateReliabilityScore",
        "const skills = { velocity, execution, quality, consistency, reliability, collaboration, initiative };",
        "private calculateReliabilityScore(",
        "dueDate",
        "streakDays currentStreak",
        "reliability: 0",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[patch_growth_service_reliability_score] no changes needed")
        return

    backup = GROWTH_SERVICE.with_suffix(GROWTH_SERVICE.suffix + ".bak-reliability-score")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_growth_service_reliability_score] backup created: {backup}")

    GROWTH_SERVICE.write_text(source, encoding="utf-8")
    print(f"[patch_growth_service_reliability_score] patched: {GROWTH_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"calculateReliabilityScore|reliability|dueDate|streakDays currentStreak|The Operator|emptySkillProfile\" src/analytics/growth.service.ts")
    print("  git diff -- src/analytics/growth.service.ts")

if __name__ == "__main__":
    main()

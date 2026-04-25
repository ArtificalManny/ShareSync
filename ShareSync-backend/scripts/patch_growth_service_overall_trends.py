from pathlib import Path
import sys

ROOT = Path.cwd()
GROWTH_SERVICE = ROOT / "src/analytics/growth.service.ts"

NEW_GROWTH_TRENDS_AND_HELPERS = r"""  async getGrowthTrends(userId: string, metric = 'all', weeks = 12) {
    const uid = new Types.ObjectId(userId);
    const safeWeeks = Math.min(Math.max(Number(weeks) || 12, 1), 52);
    const now = new Date();
    const startDate = new Date(now.getTime() - safeWeeks * 7 * 86400000);

    try {
      const tasks = await this.taskModel.find({
        $or: [
          { completedBy: uid },
          { userId: uid },
          { createdBy: uid },
          { assigneeId: uid },
        ],
        completedAt: { $gte: startDate },
        status: { $in: ['done', 'completed', 'Done', 'Completed'] },
      })
        .select('completedAt priority comments createdBy userId completedBy assigneeId')
        .lean();

      const weeklyData: any[] = [];

      for (let w = 0; w < safeWeeks; w++) {
        const weekStart = new Date(now.getTime() - (safeWeeks - w) * 7 * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

        const weekTasks = tasks.filter((task) => {
          const completedAt = task?.completedAt ? new Date(task.completedAt).getTime() : 0;
          return completedAt >= weekStart.getTime() && completedAt < weekEnd.getTime();
        });

        const rawCount = weekTasks.length;

        // Velocity: completed work volume, normalized so roughly 7 completions/week = 100.
        const velocity = this.clampScore(rawCount * 15);

        // Quality: priority-impact completion score.
        // This makes completed work count while still rewarding higher-priority completions.
        const priorityWeights: Record<string, number> = {
          critical: 1,
          urgent: 1,
          high: 0.85,
          medium: 0.65,
          normal: 0.55,
          low: 0.45,
        };

        const quality = rawCount > 0
          ? this.clampScore(
              Math.round(
                (weekTasks.reduce((sum, task) => {
                  const priority = String(task?.priority || 'normal').toLowerCase();
                  return sum + (priorityWeights[priority] ?? 0.55);
                }, 0) / rawCount) * 100,
              ),
            )
          : 0;

        // Collaboration: completed work with comments or multi-party ownership signals.
        const collaborativeTasks = weekTasks.filter((task) => {
          const hasComments = Array.isArray(task?.comments) && task.comments.length > 0;
          const createdByOther = Boolean(task?.createdBy) && String(task.createdBy) !== String(uid);
          const assignedToUser = Boolean(task?.assigneeId) && String(task.assigneeId) === String(uid);
          const completedByUser = Boolean(task?.completedBy) && String(task.completedBy) === String(uid);

          return hasComments || (createdByOther && assignedToUser) || (createdByOther && completedByUser);
        }).length;

        const collaboration = rawCount > 0
          ? this.clampScore(Math.round((collaborativeTasks / rawCount) * 100))
          : 0;

        // Overall: weighted composite used by the Profile trend comparison chart.
        const overall = this.calculateOverallScore(velocity, quality, collaboration);

        weeklyData.push({
          week: w + 1,
          label: `Week ${w + 1}`,
          date: weekStart.toISOString().slice(0, 10),
          weekStart: weekStart.toISOString().slice(0, 10),
          weekEnd: weekEnd.toISOString().slice(0, 10),
          velocity,
          quality,
          collaboration,
          overall,
          rawCount,
        });
      }

      const recentHalf = weeklyData.slice(-Math.ceil(safeWeeks / 2));
      const olderHalf = weeklyData.slice(0, Math.floor(safeWeeks / 2));

      const calcGrowth = (key: string) => {
        const recent = this.averageMetric(recentHalf, key);
        const older = this.averageMetric(olderHalf, key);

        if (older === 0) {
          return recent > 0 ? 100 : 0;
        }

        return Math.round(((recent - older) / older) * 100);
      };

      const response = {
        data: weeklyData,
        summary: {
          velocityGrowth: calcGrowth('velocity'),
          qualityGrowth: calcGrowth('quality'),
          collaborationGrowth: calcGrowth('collaboration'),
          overallGrowth: calcGrowth('overall'),
        },
        meta: {
          metric,
          weeks: safeWeeks,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          generatedAt: new Date().toISOString(),
        },
      };

      if (metric && metric !== 'all') {
        return {
          ...response,
          data: weeklyData.map((point) => ({
            ...point,
            value: point[metric] ?? 0,
          })),
        };
      }

      return response;
    } catch (err) {
      this.logger.error(`[Growth] getGrowthTrends failed for ${userId}: ${err?.message || err}`);

      return {
        data: [],
        summary: {
          velocityGrowth: 0,
          qualityGrowth: 0,
          collaborationGrowth: 0,
          overallGrowth: 0,
        },
        meta: {
          metric,
          weeks: safeWeeks,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          generatedAt: new Date().toISOString(),
        },
      };
    }
  }

  private clampScore(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private calculateOverallScore(velocity: number, quality: number, collaboration: number): number {
    return this.clampScore((velocity * 0.4) + (quality * 0.3) + (collaboration * 0.3));
  }

  private averageMetric(rows: any[], key: string): number {
    if (!rows.length) return 0;

    const total = rows.reduce((sum, row) => {
      const value = Number(row?.[key] || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return total / rows.length;
  }

"""

def fail(message):
    print(f"\n[patch_growth_service_overall_trends] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_growth_service_overall_trends] starting")

    if not GROWTH_SERVICE.exists():
        fail(f"Could not find {GROWTH_SERVICE}")

    source = GROWTH_SERVICE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class GrowthService",
        "async getGrowthTrends",
        "private determineArchetype",
        "private emptySkillProfile",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    start = source.find("  async getGrowthTrends(")
    end = source.find("  private determineArchetype(")

    if start == -1:
        fail("Could not find getGrowthTrends start. No changes were written.")

    if end == -1 or end <= start:
        fail("Could not find determineArchetype anchor after getGrowthTrends. No changes were written.")

    if "private calculateOverallScore(" in source:
        print("[patch_growth_service_overall_trends] overall scoring helpers already appear present")
        return

    patched = source[:start] + NEW_GROWTH_TRENDS_AND_HELPERS + source[end:]

    required_after = [
        "overallGrowth: calcGrowth('overall')",
        "overall,",
        "private calculateOverallScore(",
        "private averageMetric(",
        "private clampScore(",
        "createdByOther && assignedToUser",
        "createdByOther && completedByUser",
    ]

    for marker in required_after:
        if marker not in patched:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    danger_slice = patched[start:patched.find("  private determineArchetype(")]
    if " and " in danger_slice:
        fail("Safety check failed: TypeScript patch still contains Python-style `and`.")

    backup = GROWTH_SERVICE.with_suffix(GROWTH_SERVICE.suffix + ".bak-overall-trends")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_growth_service_overall_trends] backup created: {backup}")

    GROWTH_SERVICE.write_text(patched, encoding="utf-8")
    print(f"[patch_growth_service_overall_trends] patched: {GROWTH_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"overallGrowth|calculateOverallScore|averageMetric|clampScore|label:|rawCount\" src/analytics/growth.service.ts")
    print("  git diff -- src/analytics/growth.service.ts")

if __name__ == "__main__":
    main()

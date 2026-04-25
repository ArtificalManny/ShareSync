from pathlib import Path
import sys

ROOT = Path.cwd()
GROWTH_SERVICE = ROOT / "src/analytics/growth.service.ts"

NEW_GET_EVOLUTION_MOMENTS = r"""  async getEvolutionMoments(userId: string) {
    const uid = new Types.ObjectId(userId);

    try {
      const completedStatuses = ['done', 'completed', 'Done', 'Completed'];

      const completedTasks = await this.taskModel.find({
        $or: [
          { completedBy: uid },
          { userId: uid },
          { createdBy: uid },
          { assigneeId: uid },
        ],
        status: { $in: completedStatuses },
        completedAt: { $exists: true },
      })
        .sort({ completedAt: -1 })
        .limit(100)
        .select('title completedAt priority xpValue projectId comments createdBy userId completedBy assigneeId')
        .populate('projectId', 'name')
        .lean();

      const totalCompleted = await this.taskModel.countDocuments({
        $or: [
          { completedBy: uid },
          { userId: uid },
          { createdBy: uid },
          { assigneeId: uid },
        ],
        status: { $in: completedStatuses },
        completedAt: { $exists: true },
      });

      const user: any = await this.userModel
        .findById(uid)
        .select('totalXP xp level badges streakDays currentStreak createdAt')
        .lean();

      const moments: any[] = [];

      const latestTask = completedTasks[0];
      const firstTask = completedTasks[completedTasks.length - 1];

      const totalXp = Number(user?.totalXP || user?.xp || 0);
      const level = Number(user?.level || 1);
      const streak = Number(user?.streakDays || user?.currentStreak || 0);

      if (user?.createdAt) {
        moments.push({
          id: `joined-${String(uid)}`,
          type: 'level_up',
          title: 'Joined OpenShare',
          description: 'Started building a measurable profile of execution, quality, and collaboration.',
          date: user.createdAt,
          from: 'Beginner',
          to: totalCompleted > 0 ? 'Contributor' : 'Beginner',
          achievements: ['Profile created', 'Growth tracking started'],
          metrics: {
            ships: totalCompleted,
            xp: totalXp,
            level,
          },
        });
      }

      if (firstTask) {
        const projectName = (firstTask as any).projectId?.name || 'a project';

        moments.push({
          id: `first-ship-${String((firstTask as any)._id || firstTask.completedAt)}`,
          type: 'task_completed',
          title: 'First completed task',
          description: `Completed "${firstTask.title}" in ${projectName}.`,
          date: firstTask.completedAt,
          from: 'Beginner',
          to: 'Contributor',
          achievements: ['First task completed', 'Execution signal activated'],
          projectName,
          taskId: String((firstTask as any)._id || ''),
          metrics: {
            ships: 1,
            xp: Number(firstTask.xpValue || 25),
            level,
          },
        });
      }

      if (latestTask) {
        const projectName = (latestTask as any).projectId?.name || 'a project';

        moments.push({
          id: `latest-ship-${String((latestTask as any)._id || latestTask.completedAt)}`,
          type: 'project_shipped',
          title: 'Latest ship',
          description: `Most recent completed work: "${latestTask.title}" in ${projectName}.`,
          date: latestTask.completedAt,
          from: this.resolveRoleFromCompletedCount(Math.max(totalCompleted - 1, 0)),
          to: this.resolveRoleFromCompletedCount(totalCompleted),
          achievements: ['Recent execution captured', 'Profile momentum updated'],
          projectName,
          taskId: String((latestTask as any)._id || ''),
          metrics: {
            ships: totalCompleted,
            xp: Number(latestTask.xpValue || 25),
            level,
          },
        });
      }

      const highPriorityTasks = completedTasks.filter((task) =>
        ['high', 'critical', 'urgent'].includes(String(task?.priority || '').toLowerCase()),
      );

      for (const task of highPriorityTasks.slice(0, 4)) {
        const projectName = (task as any).projectId?.name || 'a project';
        const priority = String(task?.priority || 'high').toLowerCase();

        moments.push({
          id: `quality-${String((task as any)._id || task.completedAt)}`,
          type: 'quality_improved',
          title: 'High-priority work completed',
          description: `Completed a ${priority}-priority task in ${projectName}: "${task.title}".`,
          date: task.completedAt,
          from: this.resolveRoleFromCompletedCount(Math.max(totalCompleted - 1, 0)),
          to: this.resolveRoleFromCompletedCount(totalCompleted),
          achievements: ['Priority work shipped', 'Quality signal strengthened'],
          projectName,
          taskId: String((task as any)._id || ''),
          metrics: {
            priority: priority.toUpperCase(),
            xp: Number(task.xpValue || 50),
            ships: totalCompleted,
          },
        });
      }

      const collaborativeTasks = completedTasks.filter((task) => {
        const hasComments = Array.isArray(task?.comments) && task.comments.length > 0;
        const createdByOther = Boolean(task?.createdBy) && String(task.createdBy) !== String(uid);
        const assignedToUser = Boolean(task?.assigneeId) && String(task.assigneeId) === String(uid);
        const completedByUser = Boolean(task?.completedBy) && String(task.completedBy) === String(uid);

        return hasComments || (createdByOther && assignedToUser) || (createdByOther && completedByUser);
      });

      for (const task of collaborativeTasks.slice(0, 3)) {
        const projectName = (task as any).projectId?.name || 'a project';

        moments.push({
          id: `collaboration-${String((task as any)._id || task.completedAt)}`,
          type: 'collaboration_growth',
          title: 'Shared-work signal detected',
          description: `Collaboration activity was detected around "${task.title}" in ${projectName}.`,
          date: task.completedAt,
          from: this.resolveRoleFromCompletedCount(Math.max(totalCompleted - 1, 0)),
          to: this.resolveRoleFromCompletedCount(totalCompleted),
          achievements: ['Shared work detected', 'Collaboration profile updated'],
          projectName,
          taskId: String((task as any)._id || ''),
          metrics: {
            collaboration: 1,
            ships: totalCompleted,
            level,
          },
        });
      }

      const countMilestones = [10, 25, 50, 100, 250];

      for (const count of countMilestones) {
        if (totalCompleted >= count) {
          const milestoneTask = completedTasks[Math.min(completedTasks.length - 1, Math.max(0, totalCompleted - count))] || latestTask;

          moments.push({
            id: `ships-${count}-${String(uid)}`,
            type: 'streak_milestone',
            title: `${count} completed tasks`,
            description: `Reached ${count} completed tasks — a durable proof-of-work milestone.`,
            date: milestoneTask?.completedAt || new Date(),
            from: this.resolveRoleFromCompletedCount(Math.max(count - 1, 0)),
            to: this.resolveRoleFromCompletedCount(count),
            achievements: [`${count} completed tasks`, 'Execution history expanded'],
            metrics: {
              ships: count,
              xp: totalXp,
              level,
            },
          });
        }
      }

      if (streak >= 3) {
        moments.push({
          id: `streak-${streak}-${String(uid)}`,
          type: 'streak_milestone',
          title: `${streak}-day momentum streak`,
          description: 'Built a sustained habit of showing up and moving work forward.',
          date: latestTask?.completedAt || new Date(),
          from: this.resolveRoleFromCompletedCount(Math.max(totalCompleted - 1, 0)),
          to: this.resolveRoleFromCompletedCount(totalCompleted),
          achievements: ['Consistency signal detected', 'Momentum profile strengthened'],
          metrics: {
            streak,
            ships: totalCompleted,
            level,
          },
        });
      }

      if (level > 1 || totalXp > 0) {
        moments.push({
          id: `level-${level}-${String(uid)}`,
          type: 'level_up',
          title: `Level ${level} profile`,
          description: 'Your accumulated XP is now contributing to your long-term growth profile.',
          date: latestTask?.completedAt || user?.createdAt || new Date(),
          from: this.resolveRoleFromCompletedCount(Math.max(totalCompleted - 1, 0)),
          to: this.resolveRoleFromCompletedCount(totalCompleted),
          achievements: ['XP profile updated', 'Long-term progress captured'],
          metrics: {
            xp: totalXp,
            level,
            ships: totalCompleted,
          },
        });
      }

      const uniqueMoments = Array.from(
        new Map(
          moments
            .filter((moment) => moment?.date)
            .map((moment) => [moment.id || `${moment.type}-${moment.title}-${moment.date}`, moment]),
        ).values(),
      );

      uniqueMoments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return uniqueMoments.slice(0, 15);
    } catch (err) {
      this.logger.error(`[Growth] getEvolutionMoments failed for ${userId}:`, err?.message);
      return [];
    }
  }

  private resolveRoleFromCompletedCount(count: number): string {
    if (count >= 100) return 'Visionary';
    if (count >= 50) return 'Leader';
    if (count >= 25) return 'Architect';
    if (count >= 10) return 'Builder';
    if (count >= 1) return 'Contributor';
    return 'Beginner';
  }
"""

def fail(message):
    print(f"\n[patch_growth_service_evolution_moments] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_growth_service_evolution_moments] starting")

    if not GROWTH_SERVICE.exists():
        fail(f"Could not find {GROWTH_SERVICE}")

    source = GROWTH_SERVICE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class GrowthService",
        "async getEvolutionMoments",
        "async getGrowthSuggestions",
        "private determineArchetype",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "private resolveRoleFromCompletedCount(" in source and "collaboration_growth" in source:
        print("[patch_growth_service_evolution_moments] getEvolutionMoments already appears upgraded")
        return

    start = source.find("  async getEvolutionMoments(")
    end = source.find("  // ═══════════════════════════════════════════════════════════════════════════\n  // GROWTH SUGGESTIONS", start)

    if start == -1:
        fail("Could not find getEvolutionMoments start. No changes were written.")

    if end == -1 or end <= start:
        fail("Could not find Growth Suggestions anchor after getEvolutionMoments. No changes were written.")

    patched = source[:start] + NEW_GET_EVOLUTION_MOMENTS + "\n" + source[end:]

    required_after = [
        "type: 'task_completed'",
        "type: 'project_shipped'",
        "type: 'quality_improved'",
        "type: 'collaboration_growth'",
        "type: 'streak_milestone'",
        "type: 'level_up'",
        "private resolveRoleFromCompletedCount(",
        ".populate('projectId', 'name')",
    ]

    for marker in required_after:
        if marker not in patched:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if ".populate('projectId', 'name emoji')" in patched:
        fail("Safety check failed: emoji project populate still exists after patch.")

    backup = GROWTH_SERVICE.with_suffix(GROWTH_SERVICE.suffix + ".bak-evolution-moments")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_growth_service_evolution_moments] backup created: {backup}")

    GROWTH_SERVICE.write_text(patched, encoding="utf-8")
    print(f"[patch_growth_service_evolution_moments] patched: {GROWTH_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getEvolutionMoments|task_completed|project_shipped|quality_improved|collaboration_growth|streak_milestone|level_up|resolveRoleFromCompletedCount|name emoji\" src/analytics/growth.service.ts")
    print("  git diff -- src/analytics/growth.service.ts")

if __name__ == "__main__":
    main()

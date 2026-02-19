// src/insights/insights.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly projectsService: ProjectsService,
  ) {}

  async calculateProjectInsights(projectId: string, userId: string, range: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid project ID');
    }

    // ⭐ THE FIX: Safely verify the project exists without crashing on an undefined userId
    if (userId) {
      await this.projectsService.findByIdWithAccess(projectId, userId);
    } else {
      const project = await this.projectsService.findById(projectId);
      if (!project) throw new NotFoundException('Project not found');
    }

    const days = parseInt(range.replace('d', '')) || 7;
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    const projectObjId = new Types.ObjectId(projectId);

    const [currentCompleted, previousCompleted, activeTasks] = await Promise.all([
      this.taskModel.find({
        projectId: projectObjId,
        status: TaskStatus.DONE,
        completedAt: { $gte: currentStart, $lte: now },
      }).lean(),
      this.taskModel.find({
        projectId: projectObjId,
        status: TaskStatus.DONE,
        completedAt: { $gte: previousStart, $lt: currentStart },
      }).lean(),
      this.taskModel.find({
        projectId: projectObjId,
        status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] },
      }).populate('assigneeId', 'name username').lean(),
    ]);

    const currentVelocity = currentCompleted.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const prevVelocity = previousCompleted.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const velocityTrend = this.calculateTrend(currentVelocity, prevVelocity);

    const currentCycleTime = this.calculateAverageCycleTime(currentCompleted);
    const prevCycleTime = this.calculateAverageCycleTime(previousCompleted);
    const cycleTimeTrend = this.calculateTrend(currentCycleTime, prevCycleTime);

    const totalCurrentTasks = currentCompleted.length + activeTasks.length;
    const completionRate = totalCurrentTasks === 0 ? 0 : Math.round((currentCompleted.length / totalCurrentTasks) * 100);

    const workloadMap = new Map<string, { user: any; points: number; count: number }>();
    activeTasks.forEach((task: any) => {
      if (!task.assigneeId) return;
      const uId = task.assigneeId._id.toString();
      const current = workloadMap.get(uId) || { user: task.assigneeId, points: 0, count: 0 };
      current.points += (task.storyPoints || 1);
      current.count += 1;
      workloadMap.set(uId, current);
    });

    const totalActivePoints = Array.from(workloadMap.values()).reduce((sum, w) => sum + w.points, 0);
    const avgPointsPerUser = workloadMap.size > 0 ? totalActivePoints / workloadMap.size : 1;

    const teamBalance = Array.from(workloadMap.values()).map(w => ({
      userId: w.user._id,
      name: w.user.name || w.user.username || 'Unknown',
      workloadPercentage: Math.min(Math.round((w.points / avgPointsPerUser) * 100), 150),
      taskCount: w.count
    })).sort((a, b) => b.workloadPercentage - a.workloadPercentage);

    const aiInsights = this.generateAIInsights(currentVelocity, currentCycleTime, teamBalance);

    return {
      success: true,
      data: {
        metrics: {
          velocity: { value: currentVelocity, trend: velocityTrend, unit: 'points/range' },
          cycleTime: { value: Number(currentCycleTime.toFixed(1)), trend: cycleTimeTrend, unit: 'days/task' },
          completionRate: { value: completionRate, trend: 0, unit: '% done' },
          collaboration: { value: currentCompleted.length > 0 ? Number((currentCompleted.length * 1.5).toFixed(1)) : 0, trend: 0, unit: 'interactions/day' },
        },
        teamBalance,
        aiInsights,
      }
    };
  }

  private calculateAverageCycleTime(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const totalDays = tasks.reduce((sum, task) => {
      const created = new Date(task.createdAt || Date.now()).getTime();
      const completed = new Date(task.completedAt || Date.now()).getTime();
      const days = (completed - created) / (1000 * 60 * 60 * 24);
      return sum + Math.max(days, 0); // Prevent negative math
    }, 0);
    return totalDays / tasks.length;
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private generateAIInsights(velocity: number, cycleTime: number, teamBalance: any[]) {
    const insights = [];

    if (cycleTime > 5) {
      insights.push({
        type: 'warning',
        title: 'Tasks are lingering in progress',
        description: `Average cycle time is ${cycleTime.toFixed(1)} days. Consider breaking tasks down into smaller increments.`,
        actionText: 'View Stuck Items'
      });
    }

    const overloadedUser = teamBalance.find(u => u.workloadPercentage >= 120);
    if (overloadedUser) {
      insights.push({
        type: 'alert',
        title: `${overloadedUser.name} is at risk of burnout`,
        description: `They are carrying ${overloadedUser.workloadPercentage}% of the target workload. Consider reassigning their tasks.`,
        actionText: 'Rebalance Workload'
      });
    }

    if (velocity > 0 && cycleTime <= 3) {
      insights.push({
        type: 'success',
        title: 'Incredible momentum! 🚀',
        description: 'Your team is shipping fast and efficiently.',
        actionText: 'Celebrate'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Consistent pacing',
        description: 'Your throughput is stable. Look at your Stack to prioritize the highest value tasks.',
        actionText: 'View Priority Stack'
      });
    }

    return insights;
  }
}

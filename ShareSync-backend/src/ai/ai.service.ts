// src/ai/ai.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AI SUGGESTIONS SERVICE: Smart recommendations and predictions
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SuggestionType,
  SuggestionDto,
  TaskAnalysisDto,
  WorkloadSummaryDto,
  ScheduleRecommendationDto,
} from './dto/ai.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface TaskData {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignee?: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  projectId: Types.ObjectId;
  isBlocking?: boolean;
  blockedBy?: Types.ObjectId[];
}

interface UserWorkload {
  userId: string;
  name: string;
  activeTasks: number;
  pendingTasks: number;
  completedThisWeek: number;
  upcomingDeadlines: number;
  avgCompletionTime: number;
  currentCapacity: number;
}

type ImpactLevel = 'high' | 'medium' | 'low';
type LoadStatus = 'underutilized' | 'balanced' | 'overloaded';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    @InjectModel('Task') private readonly taskModel: Model<any>,
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('UserStats') private readonly userStatsModel: Model<any>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // SUGGESTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async getSuggestions(
    userId: string,
    options: {
      type?: SuggestionType;
      projectId?: string;
      limit?: number;
    } = {},
  ): Promise<SuggestionDto[]> {
    const suggestions: SuggestionDto[] = [];
    const limit = options.limit || 10;

    // Get context
    const projects = options.projectId
      ? [await this.projectModel.findById(options.projectId)]
      : await this.projectModel
          .find({
            'members.userId': new Types.ObjectId(userId),
            status: 'active',
          })
          .limit(5);

    for (const project of projects) {
      if (!project) continue;

      // Generate suggestions based on type or all types
      if (!options.type || options.type === SuggestionType.TASK_PRIORITY) {
        suggestions.push(...(await this.generatePrioritySuggestions(project._id)));
      }

      if (!options.type || options.type === SuggestionType.WORKLOAD_BALANCE) {
        suggestions.push(...(await this.generateWorkloadSuggestions(project._id)));
      }

      if (!options.type || options.type === SuggestionType.RISK_DETECTION) {
        suggestions.push(...(await this.generateRiskSuggestions(project._id)));
      }

      if (!options.type || options.type === SuggestionType.DEADLINE_PREDICTION) {
        suggestions.push(...(await this.generateDeadlineSuggestions(project._id)));
      }
    }

    // Sort by confidence and impact
    suggestions.sort((a, b) => {
      const impactScore: Record<ImpactLevel, number> = { high: 3, medium: 2, low: 1 };
      return impactScore[b.impact as ImpactLevel] * b.confidence - impactScore[a.impact as ImpactLevel] * a.confidence;
    });

    return suggestions.slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TASK ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────

  async analyzeTask(taskId: string): Promise<TaskAnalysisDto> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new Error('Task not found');

    // Analyze task characteristics
    const suggestedPriority = await this.predictPriority(task);
    const suggestedAssignee = await this.suggestAssignee(task);
    const estimatedDuration = await this.estimateDuration(task);
    const riskFactors = this.detectRiskFactors(task);
    const similarTasks = await this.findSimilarTasks(task);

    return {
      taskId: task._id.toString(),
      suggestedPriority: suggestedPriority.priority,
      priorityConfidence: suggestedPriority.confidence,
      suggestedAssignee,
      estimatedDuration,
      riskFactors,
      dependencies: task.blockedBy?.map((id: Types.ObjectId) => id.toString()) || [],
      similarTasks,
    };
  }

  private async predictPriority(
    task: TaskData,
  ): Promise<{ priority: string; confidence: number }> {
    let score = 0;
    let factors = 0;

    // Check for urgency keywords
    const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency', 'blocker', 'blocking'];
    const highKeywords = ['important', 'high', 'priority', 'deadline', 'customer'];

    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    if (urgentKeywords.some((k) => text.includes(k))) {
      score += 4;
      factors++;
    } else if (highKeywords.some((k) => text.includes(k))) {
      score += 3;
      factors++;
    }

    // Check due date proximity
    if (task.dueDate) {
      const daysUntilDue = Math.ceil(
        (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysUntilDue < 0) score += 4; // Overdue
      else if (daysUntilDue <= 1) score += 3;
      else if (daysUntilDue <= 3) score += 2;
      else if (daysUntilDue <= 7) score += 1;
      factors++;
    }

    // Check if blocking
    if (task.isBlocking) {
      score += 3;
      factors++;
    }

    // Normalize score
    const normalizedScore = factors > 0 ? score / factors : 1;

    let priority: string;
    let confidence: number;

    if (normalizedScore >= 3) {
      priority = 'critical';
      confidence = Math.min(95, 60 + normalizedScore * 10);
    } else if (normalizedScore >= 2) {
      priority = 'high';
      confidence = Math.min(90, 55 + normalizedScore * 10);
    } else if (normalizedScore >= 1) {
      priority = 'medium';
      confidence = Math.min(85, 50 + normalizedScore * 10);
    } else {
      priority = 'low';
      confidence = 70;
    }

    return { priority, confidence };
  }

  private async suggestAssignee(
    task: TaskData,
  ): Promise<{ userId: string; name: string; reason: string } | undefined> {
    // Get project members
    const project = await this.projectModel
      .findById(task.projectId)
      .populate('members.userId');

    if (!project || !project.members?.length) return undefined;

    // Get workload for each member
    const memberWorkloads: UserWorkload[] = [];

    for (const member of project.members) {
      if (!member.userId) continue;

      const workload = await this.calculateUserWorkload(
        member.userId._id.toString(),
        task.projectId.toString(),
      );

      memberWorkloads.push(workload);
    }

    // Find best fit (lowest workload with relevant experience)
    const sorted = memberWorkloads.sort((a, b) => a.currentCapacity - b.currentCapacity);
    const bestFit = sorted.find((m) => m.currentCapacity < 80);

    if (bestFit) {
      return {
        userId: bestFit.userId,
        name: bestFit.name,
        reason: `Has ${100 - bestFit.currentCapacity}% capacity available and ${bestFit.completedThisWeek} tasks completed this week`,
      };
    }

    return undefined;
  }

  private async estimateDuration(
    task: TaskData,
  ): Promise<{ hours: number; confidence: number }> {
    // Find similar completed tasks
    const similarTasks = await this.taskModel
      .find({
        projectId: task.projectId,
        status: 'done',
        completedAt: { $exists: true },
      })
      .limit(50);

    if (similarTasks.length === 0) {
      // Default estimates by priority
      const defaults: Record<string, number> = {
        critical: 8,
        high: 6,
        medium: 4,
        low: 2,
      };

      return {
        hours: defaults[task.priority] || 4,
        confidence: 30,
      };
    }

    // Calculate average duration
    const durations = similarTasks
      .filter((t: any) => t.completedAt && t.createdAt)
      .map((t: any) => (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));

    const avgDuration = durations.reduce((a: number, b: number) => a + b, 0) / Math.max(durations.length, 1);
    const confidence = Math.min(85, 40 + similarTasks.length);

    return {
      hours: Math.round(avgDuration * 10) / 10,
      confidence,
    };
  }

  private detectRiskFactors(task: TaskData): string[] {
    const risks: string[] = [];

    // Overdue
    if (task.dueDate && task.dueDate < new Date() && task.status !== 'done') {
      risks.push('Task is overdue');
    }

    // No assignee
    if (!task.assignee) {
      risks.push('No assignee assigned');
    }

    // No due date
    if (!task.dueDate) {
      risks.push('No due date set');
    }

    // Blocking task not prioritized
    if (task.isBlocking && task.priority === 'low') {
      risks.push('Blocking task has low priority');
    }

    // Vague description
    if (!task.description || task.description.length < 20) {
      risks.push('Task description may be too vague');
    }

    return risks;
  }

  private async findSimilarTasks(
    task: TaskData,
  ): Promise<{ taskId: string; title: string; similarity: number }[]> {
    // Simple keyword-based similarity
    const words = task.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const similar = await this.taskModel.aggregate([
      {
        $match: {
          projectId: task.projectId,
          _id: { $ne: task._id },
          status: 'done',
        },
      },
      {
        $addFields: {
          titleLower: { $toLower: '$title' },
        },
      },
      { $limit: 100 },
    ]);

    return (similar || [])
      .map((t: any) => {
        const matchCount = words.filter((w) => String(t.titleLower || '').includes(w)).length;
        return {
          taskId: t._id.toString(),
          title: t.title,
          similarity: Math.round((matchCount / Math.max(words.length, 1)) * 100),
        };
      })
      .filter((t: any) => t.similarity > 30)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WORKLOAD ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────

  async analyzeWorkload(
    projectId: string,
    userIds?: string[],
  ): Promise<WorkloadSummaryDto[]> {
    const project = await this.projectModel
      .findById(projectId)
      .populate('members.userId');

    if (!project) throw new Error('Project not found');

    const targetUserIds =
      userIds || project.members.map((m: any) => m.userId._id.toString());

    const summaries: WorkloadSummaryDto[] = [];

    for (const userId of targetUserIds) {
      const workload = await this.calculateUserWorkload(userId, projectId);

      let loadStatus: LoadStatus;
      const recommendations: string[] = [];

      if (workload.currentCapacity < 40) {
        loadStatus = 'underutilized';
        recommendations.push('Can take on more tasks');
        recommendations.push('Consider assigning blocking tasks');
      } else if (workload.currentCapacity > 80) {
        loadStatus = 'overloaded';
        recommendations.push('Consider redistributing tasks');
        if (workload.upcomingDeadlines > 3) {
          recommendations.push('High deadline pressure - may need support');
        }
      } else {
        loadStatus = 'balanced';
        recommendations.push('Workload is well balanced');
      }

      summaries.push({
        userId,
        userName: workload.name,
        currentLoad: workload.currentCapacity,
        loadStatus,
        activeTasks: workload.activeTasks,
        upcomingDeadlines: workload.upcomingDeadlines,
        recommendations,
      });
    }

    return summaries;
  }

  private async calculateUserWorkload(
    userId: string,
    projectId: string,
  ): Promise<UserWorkload> {
    const user = await this.userModel.findById(userId);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [activeTasks, pendingTasks, completedThisWeek, upcomingDeadlines] =
      await Promise.all([
        this.taskModel.countDocuments({
          assignee: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
          status: { $in: ['in_progress', 'review'] },
        }),
        this.taskModel.countDocuments({
          assignee: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
          status: 'todo',
        }),
        this.taskModel.countDocuments({
          assignee: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
          status: 'done',
          completedAt: { $gte: weekAgo },
        }),
        this.taskModel.countDocuments({
          assignee: new Types.ObjectId(userId),
          projectId: new Types.ObjectId(projectId),
          status: { $ne: 'done' },
          dueDate: { $lte: nextWeek },
        }),
      ]);

    // Calculate capacity (0-100)
    // Assuming optimal is 5-8 active tasks
    const optimalActive = 6;
    const currentCapacity = Math.min(100, (activeTasks / optimalActive) * 100);

    return {
      userId,
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      activeTasks,
      pendingTasks,
      completedThisWeek,
      upcomingDeadlines,
      avgCompletionTime: 0, // Would need historical data
      currentCapacity: Math.round(currentCapacity),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SMART SCHEDULING
  // ─────────────────────────────────────────────────────────────────────────────

  async generateSmartSchedule(
    projectId: string,
    sprintId?: string,
  ): Promise<ScheduleRecommendationDto[]> {
    const filter: any = {
      projectId: new Types.ObjectId(projectId),
      status: { $in: ['todo', 'backlog'] },
    };

    if (sprintId) {
      filter.sprintId = new Types.ObjectId(sprintId);
    }

    const unscheduledTasks = await this.taskModel.find(filter).populate('assignee');
    const workloads = await this.analyzeWorkload(projectId);

    const recommendations: ScheduleRecommendationDto[] = [];
    const now = new Date();

    for (const task of unscheduledTasks) {
      const analysis = await this.analyzeTask(task._id.toString());

      // Find best assignee
      const bestAssignee = workloads
        .slice()
        .sort((a, b) => a.currentLoad - b.currentLoad)
        .find((w) => w.loadStatus !== 'overloaded');

      if (!bestAssignee) continue;

      // Calculate suggested dates
      const startOffset = Math.max(1, Math.round(bestAssignee.currentLoad / 20));
      const suggestedStart = new Date(now);
      suggestedStart.setDate(suggestedStart.getDate() + startOffset);

      const suggestedEnd = new Date(suggestedStart);
      suggestedEnd.setDate(
        suggestedEnd.getDate() + Math.ceil(analysis.estimatedDuration.hours / 8),
      );

      recommendations.push({
        taskId: task._id.toString(),
        taskTitle: task.title,
        suggestedStart,
        suggestedEnd,
        suggestedAssignee: bestAssignee.userId,
        reason: `${bestAssignee.userName} has ${100 - bestAssignee.currentLoad}% capacity. Estimated ${analysis.estimatedDuration.hours}h to complete.`,
      });
    }

    return recommendations.slice(0, 20);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUGGESTION GENERATORS
  // ─────────────────────────────────────────────────────────────────────────────

  private async generatePrioritySuggestions(
    projectId: Types.ObjectId,
  ): Promise<SuggestionDto[]> {
    const suggestions: SuggestionDto[] = [];

    // Find tasks that might need reprioritization
    const tasks = await this.taskModel.find({
      projectId,
      status: { $ne: 'done' },
    });

    for (const task of tasks) {
      const predicted = await this.predictPriority(task);

      if (predicted.priority !== task.priority && predicted.confidence > 70) {
        suggestions.push({
          id: new Types.ObjectId().toString(),
          type: SuggestionType.TASK_PRIORITY,
          title: `Consider changing "${task.title}" priority`,
          description: `This task is currently ${task.priority} but analysis suggests it should be ${predicted.priority}.`,
          confidence: predicted.confidence,
          impact: (predicted.priority === 'critical' ? 'high' : 'medium') as ImpactLevel,
          actionable: true,
          action: {
            type: 'update_task_priority',
            data: { taskId: task._id, newPriority: predicted.priority },
          },
          reasoning: `Based on keywords, due date, and blocking status.`,
          createdAt: new Date(),
        });
      }
    }

    return suggestions.slice(0, 3);
  }

  private async generateWorkloadSuggestions(
    projectId: Types.ObjectId,
  ): Promise<SuggestionDto[]> {
    const suggestions: SuggestionDto[] = [];
    const workloads = await this.analyzeWorkload(projectId.toString());

    const overloaded = workloads.filter((w) => w.loadStatus === 'overloaded');
    const underutilized = workloads.filter((w) => w.loadStatus === 'underutilized');

    if (overloaded.length > 0 && underutilized.length > 0) {
      suggestions.push({
        id: new Types.ObjectId().toString(),
        type: SuggestionType.WORKLOAD_BALANCE,
        title: 'Workload imbalance detected',
        description: `${overloaded.length} team member(s) are overloaded while ${underutilized.length} have capacity.`,
        confidence: 85,
        impact: 'high',
        actionable: true,
        action: {
          type: 'view_workload',
          data: { projectId, overloaded: overloaded.map((w) => w.userId) },
        },
        reasoning: `Redistributing tasks could improve team velocity and prevent burnout.`,
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  private async generateRiskSuggestions(
    projectId: Types.ObjectId,
  ): Promise<SuggestionDto[]> {
    const suggestions: SuggestionDto[] = [];

    // Find overdue tasks
    const overdueTasks = await this.taskModel.countDocuments({
      projectId,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });

    if (overdueTasks > 0) {
      suggestions.push({
        id: new Types.ObjectId().toString(),
        type: SuggestionType.RISK_DETECTION,
        title: `${overdueTasks} overdue task(s) need attention`,
        description: `There are ${overdueTasks} tasks past their due date. Consider reprioritizing or adjusting deadlines.`,
        confidence: 95,
        impact: 'high',
        actionable: true,
        action: {
          type: 'view_overdue',
          data: { projectId },
        },
        reasoning: `Overdue tasks can cascade into delays for dependent work.`,
        createdAt: new Date(),
      });
    }

    // Find blocking tasks not in progress
    const stuckBlockers = await this.taskModel.countDocuments({
      projectId,
      isBlocking: true,
      status: { $in: ['todo', 'backlog'] },
    });

    if (stuckBlockers > 0) {
      suggestions.push({
        id: new Types.ObjectId().toString(),
        type: SuggestionType.RISK_DETECTION,
        title: `${stuckBlockers} blocking task(s) not started`,
        description: `These blocking tasks may delay other work. Consider starting them immediately.`,
        confidence: 90,
        impact: 'high',
        actionable: true,
        action: {
          type: 'view_blockers',
          data: { projectId },
        },
        reasoning: `Blocking tasks should be prioritized to unblock dependent work.`,
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  private async generateDeadlineSuggestions(
    projectId: Types.ObjectId,
  ): Promise<SuggestionDto[]> {
    const suggestions: SuggestionDto[] = [];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Find tasks due soon without assignees
    const unassignedDueSoon = await this.taskModel.countDocuments({
      projectId,
      status: { $ne: 'done' },
      dueDate: { $lte: nextWeek },
      assignee: { $exists: false },
    });

    if (unassignedDueSoon > 0) {
      suggestions.push({
        id: new Types.ObjectId().toString(),
        type: SuggestionType.DEADLINE_PREDICTION,
        title: `${unassignedDueSoon} unassigned task(s) due this week`,
        description: `These tasks are due within a week but have no assignee.`,
        confidence: 88,
        impact: 'high',
        actionable: true,
        action: {
          type: 'assign_tasks',
          data: { projectId },
        },
        reasoning: `Unassigned tasks with upcoming deadlines are at risk of being missed.`,
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEKLY INSIGHTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyInsights(): Promise<void> {
    this.logger.log('Generating weekly AI insights...');

    const activeProjects = await this.projectModel.find({ status: 'active' });

    for (const project of activeProjects) {
      const suggestions = await this.getSuggestions('system', {
        projectId: project._id.toString(),
        limit: 5,
      });

      if (suggestions.length > 0) {
        this.eventEmitter.emit('ai.weekly_insights', {
          projectId: project._id,
          projectName: project.name,
          suggestions,
        });
      }
    }
  }
}

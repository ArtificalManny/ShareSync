import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  DailyFocusMove,
  DailyFocusPlan,
  DailyFocusPlanDocument,
} from './schemas/daily-focus-plan.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Milestone, MilestoneDocument } from '../milestones/schemas/milestone.schema';

type DailyFocusResponse = {
  dateKey: string;
  status: 'suggested' | 'accepted' | 'completed';
  question: string;
  suggestions: DailyFocusMove[];
  selectedMoves: DailyFocusMove[];
};

@Injectable()
export class DailyFocusService {
  private readonly logger = new Logger(DailyFocusService.name);

  constructor(
    @InjectModel(DailyFocusPlan.name)
    private readonly dailyFocusPlanModel: Model<DailyFocusPlanDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Milestone.name)
    private readonly milestoneModel: Model<MilestoneDocument>,
  ) {}

  async getToday(
    userId: string,
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const plan = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .lean()
      .exec();

    if (plan?.selectedMoves?.length) {
      return {
        dateKey,
        status: plan.status || 'accepted',
        question: 'What should we work on today?',
        suggestions: [],
        selectedMoves: plan.selectedMoves as DailyFocusMove[],
      };
    }

    const suggestions = await this.buildSuggestionsForUser(
      userObjectId,
      plan?.dismissedSuggestionIds || [],
    );

    return {
      dateKey,
      status: 'suggested',
      question: 'What should we work on today?',
      suggestions,
      selectedMoves: [],
    };
  }

  async acceptToday(
    userId: string,
    moveIds: string[],
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    if (!Array.isArray(moveIds) || moveIds.length === 0) {
      throw new BadRequestException('moveIds are required');
    }

    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const existing = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .lean()
      .exec();

    const suggestions = await this.buildSuggestionsForUser(
      userObjectId,
      existing?.dismissedSuggestionIds || [],
    );

    const selectedMoves = suggestions
      .filter((move) => moveIds.includes(move.id))
      .slice(0, 3)
      .map((move) => ({
        ...move,
        status: 'todo' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (!selectedMoves.length) {
      throw new BadRequestException('No valid moves were selected');
    }

    // Newly accepted moves start as todo, so the plan enters accepted state.
    // The plan becomes completed later inside completeMove() after all selected moves are done.
    const status = 'accepted' as const;

    await this.dailyFocusPlanModel
      .findOneAndUpdate(
        { userId: userObjectId, dateKey },
        {
          $set: {
            userId: userObjectId,
            dateKey,
            timezone,
            status,
            selectedMoves,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    this.logger.log(
      `Accepted ${selectedMoves.length} daily focus moves for user ${userId}`,
    );

    return {
      dateKey,
      status,
      question: 'What should we work on today?',
      suggestions: [],
      selectedMoves,
    };
  }

  async addMove(
    userId: string,
    dto: { title?: string; projectId?: string },
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const title = String(dto?.title || '').trim();

    if (!title) {
      throw new BadRequestException('title is required');
    }

    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    let projectObjectId: Types.ObjectId | undefined;
    let projectName = '';

    if (dto?.projectId) {
      projectObjectId = this.toObjectId(dto.projectId, 'Invalid projectId');
      const project = await this.findUserProjectById(userObjectId, projectObjectId);

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      projectName = String(
        (project as any).title || (project as any).name || '',
      );
    }

    const plan = await this.getOrCreatePlan(userObjectId, dateKey, timezone);

    if ((plan.selectedMoves || []).filter((m) => m.status !== 'dismissed').length >= 3) {
      throw new BadRequestException('Today already has 3 selected moves');
    }

    const move: DailyFocusMove = {
      id: `custom_${randomUUID()}`,
      sourceType: 'custom',
      projectId: projectObjectId,
      projectName,
      title,
      reason: 'Added manually for today',
      priority: 'normal',
      score: 50,
      estimatedMomentum: 10,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    plan.selectedMoves.push(move as any);
    plan.status = 'accepted';

    await plan.save();

    return this.getToday(userId, timezone);
  }

  async updateMove(
    userId: string,
    moveId: string,
    dto: { title?: string },
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const title = String(dto?.title || '').trim();

    if (!title) {
      throw new BadRequestException('title is required');
    }

    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const plan = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .exec();

    if (!plan) {
      throw new NotFoundException('Daily focus plan not found');
    }

    const move = (plan.selectedMoves || []).find((item) => item.id === moveId);

    if (!move) {
      throw new NotFoundException('Move not found');
    }

    move.title = title;
    move.updatedAt = new Date();

    await plan.save();

    return this.getToday(userId, timezone);
  }

  async deleteMove(
    userId: string,
    moveId: string,
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const plan = await this.getOrCreatePlan(userObjectId, dateKey, timezone);

    plan.selectedMoves = (plan.selectedMoves || []).filter(
      (item) => item.id !== moveId,
    );

    plan.dismissedSuggestionIds = Array.from(
      new Set([...(plan.dismissedSuggestionIds || []), moveId]),
    );

    if (!plan.selectedMoves.length) {
      plan.status = 'suggested';
    }

    await plan.save();

    return this.getToday(userId, timezone);
  }

  async completeMove(
    userId: string,
    moveId: string,
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const plan = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .exec();

    if (!plan) {
      throw new NotFoundException('Daily focus plan not found');
    }

    const selectedMoves = [...(plan.selectedMoves || [])] as any[];
    const moveIndex = selectedMoves.findIndex((item) => item.id === moveId);

    if (moveIndex === -1) {
      throw new NotFoundException('Move not found');
    }

    const now = new Date();

    selectedMoves[moveIndex] = {
      ...(selectedMoves[moveIndex] as any),
      status: 'done',
      completedAt: (selectedMoves[moveIndex] as any).completedAt || now,
      updatedAt: now,
    };

    plan.selectedMoves = selectedMoves as any;

    const activeMoves = selectedMoves.filter(
      (item) => item.status !== 'dismissed',
    );

    plan.status =
      activeMoves.length > 0 && activeMoves.every((item) => item.status === 'done')
        ? 'completed'
        : 'accepted';

    // Important: force Mongoose to persist nested array changes.
    plan.markModified('selectedMoves');
    plan.markModified('status');

    await plan.save();

    this.logger.log(
      `Completed daily focus move ${moveId} for user ${userId}. Plan status: ${plan.status}`,
    );

    return this.getToday(userId, timezone);
  }

  private async getOrCreatePlan(
    userObjectId: Types.ObjectId,
    dateKey: string,
    timezone: string,
  ): Promise<DailyFocusPlanDocument> {
    const existing = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .exec();

    if (existing) return existing;

    return this.dailyFocusPlanModel.create({
      userId: userObjectId,
      dateKey,
      timezone,
      status: 'suggested',
      selectedMoves: [],
      dismissedSuggestionIds: [],
    });
  }

  private async buildSuggestionsForUser(
    userObjectId: Types.ObjectId,
    dismissedSuggestionIds: string[],
  ): Promise<DailyFocusMove[]> {
    const projects = await this.projectModel
      .find(this.buildUserProjectQuery(userObjectId))
      .select('_id title name color status updatedAt createdAt owner ownerId members')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()
      .exec();

    const projectIds = projects.map((project: any) => project._id);

    if (!projectIds.length) {
      return [];
    }

    const projectMap = new Map(
      projects.map((project: any) => [
        String(project._id),
        String(project.title || project.name || 'Untitled Project'),
      ]),
    );

    const projectColorMap = new Map(
      projects.map((project: any) => [
        String(project._id),
        String(project.color || '#8B5CF6'),
      ]),
    );

    const tasks = await this.taskModel
      .find({
        projectId: { $in: projectIds },
        completedAt: null,
        status: {
          $nin: [
            'done',
            'completed',
            'complete',
            'archived',
            'deleted',
            'DONE',
            'COMPLETED',
            'COMPLETE',
            'ARCHIVED',
            'DELETED',
          ],
        },
      })
      .select(
        '_id title name description projectId priority status isBlocking dueDate deadline assignee assigneeId assignedTo assignedToId reporter reporterId createdBy createdById updatedAt createdAt',
      )
      .limit(100)
      .lean()
      .exec();

    const milestones = await this.milestoneModel
      .find({
        projectId: { $in: projectIds },
        status: {
          $nin: ['completed', 'complete', 'done', 'COMPLETED', 'COMPLETE', 'DONE'],
        },
        $and: [
          {
            $or: [
              { completedAt: { $exists: false } },
              { completedAt: null },
            ],
          },
          {
            $or: [
              { progress: { $exists: false } },
              { progress: null },
              { progress: { $lt: 100 } },
            ],
          },
        ],
      })
      .select(
        '_id title description projectId targetDate status progress blockedBy dependsOn createdBy updatedAt createdAt',
      )
      .sort({ targetDate: 1, updatedAt: -1 })
      .limit(100)
      .lean()
      .exec();

    const dismissed = new Set(dismissedSuggestionIds || []);

    const taskSuggestions = tasks
      .map((task: any) => this.taskToSuggestion(task, userObjectId, projectMap, projectColorMap))
      .filter((move) => move.title && !dismissed.has(move.id));

    const milestoneSuggestions = milestones
      .map((milestone: any) =>
        this.milestoneToSuggestion(
          milestone,
          userObjectId,
          projectMap,
          projectColorMap,
        ),
      )
      .filter((move) => move.title && !dismissed.has(move.id));

    const ranked = [...taskSuggestions, ...milestoneSuggestions].sort((a, b) => {
      return (b.score || 0) - (a.score || 0);
    });

    if (ranked.length >= 3) {
      return ranked.slice(0, 3);
    }

    const usedProjectIds = new Set(
      ranked.map((move) => String(move.projectId || '')),
    );

    const projectSuggestions = projects
      .filter((project: any) => !usedProjectIds.has(String(project._id)))
      .slice(0, 3 - ranked.length)
      .map((project: any) => this.projectToSuggestion(project))
      .filter((move) => !dismissed.has(move.id));

    return [...ranked, ...projectSuggestions].slice(0, 3);
  }

  private taskToSuggestion(
    task: any,
    userObjectId: Types.ObjectId,
    projectMap: Map<string, string>,
    projectColorMap: Map<string, string>,
  ): DailyFocusMove {
    const taskId = String(task._id);
    const projectId = task.projectId ? String(task.projectId) : '';
    const priority = String(task.priority || 'normal').toLowerCase();

    const isAssignedToUser = [
      task.assignee,
      task.assigneeId,
      task.assignedTo,
      task.assignedToId,
      task.reporter,
      task.reporterId,
      task.createdBy,
      task.createdById,
    ].some((value) => this.sameObjectId(value, userObjectId));

    let score = 10;
    const reasons: string[] = [];

    if (isAssignedToUser) {
      score += 25;
      reasons.push('assigned to you');
    }

    if (priority === 'critical' || priority === 'urgent') {
      score += 35;
      reasons.push('critical priority');
    } else if (priority === 'high') {
      score += 25;
      reasons.push('high priority');
    } else if (priority === 'medium') {
      score += 10;
    }

    if (task.isBlocking) {
      score += 25;
      reasons.push('blocking other work');
    }

    const dueAt = task.dueDate || task.deadline;

    if (dueAt) {
      const msUntilDue = new Date(dueAt).getTime() - Date.now();
      const daysUntilDue = msUntilDue / (1000 * 60 * 60 * 24);

      if (daysUntilDue <= 1) {
        score += 30;
        reasons.push('due soon');
      } else if (daysUntilDue <= 3) {
        score += 20;
        reasons.push('coming up soon');
      } else if (daysUntilDue <= 7) {
        score += 10;
      }
    }

    const updatedAt = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;

    if (updatedAt && Date.now() - updatedAt < 1000 * 60 * 60 * 24 * 7) {
      score += 5;
    }

    const reason =
      reasons.length > 0
        ? `Recommended because this is ${reasons.join(', ')}.`
        : 'Recommended from your active project work.';

    return {
      id: `task_${taskId}`,
      sourceType: 'task',
      sourceId: new Types.ObjectId(taskId),
      projectId: task.projectId,
      projectName: projectMap.get(projectId) || '',
      title: String(task.title || task.name || 'Untitled task'),
      reason,
      priority,
      score,
      estimatedMomentum: Math.max(10, Math.min(40, Math.round(score / 2))),
      deadline: dueAt || undefined,
      projectColor: projectColorMap.get(projectId) || '#8B5CF6',
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private milestoneToSuggestion(
    milestone: any,
    userObjectId: Types.ObjectId,
    projectMap: Map<string, string>,
    projectColorMap: Map<string, string>,
  ): DailyFocusMove {
    const milestoneId = String(milestone._id);
    const projectId = milestone.projectId ? String(milestone.projectId) : '';
    const status = String(milestone.status || 'planned').toLowerCase();
    const progressValue = Number(milestone.progress || 0);
    const progress = Number.isFinite(progressValue)
      ? Math.max(0, Math.min(99, progressValue))
      : 0;

    let score = 18;
    const reasons: string[] = [];

    if (status === 'at_risk') {
      score += 35;
      reasons.push('at risk');
    } else if (status === 'in_progress') {
      score += 22;
      reasons.push('already in progress');
    }

    if (progress > 0) {
      score += Math.min(15, Math.round(progress / 10));
      reasons.push(`${progress}% complete`);
    }

    const blockedCount = Array.isArray(milestone.blockedBy)
      ? milestone.blockedBy.length
      : 0;

    if (blockedCount > 0) {
      score += 15;
      reasons.push('waiting on dependencies');
    }

    const deadline = milestone.targetDate;

    if (deadline) {
      const msUntilDue = new Date(deadline).getTime() - Date.now();
      const daysUntilDue = msUntilDue / (1000 * 60 * 60 * 24);

      if (daysUntilDue < 0) {
        score += 35;
        reasons.push('past its target date');
      } else if (daysUntilDue <= 1) {
        score += 30;
        reasons.push('due within a day');
      } else if (daysUntilDue <= 3) {
        score += 20;
        reasons.push('due within three days');
      } else if (daysUntilDue <= 7) {
        score += 10;
        reasons.push('due this week');
      }
    }

    if (this.sameObjectId(milestone.createdBy, userObjectId)) {
      score += 5;
    }

    const reason =
      reasons.length > 0
        ? `Roadmap milestone recommended because it is ${reasons.join(', ')}.`
        : 'Unfinished Roadmap milestone from one of your active projects.';

    return {
      id: `milestone_${milestoneId}`,
      sourceType: 'milestone',
      sourceId: new Types.ObjectId(milestoneId),
      projectId: milestone.projectId,
      projectName: projectMap.get(projectId) || '',
      projectColor: projectColorMap.get(projectId) || '#8B5CF6',
      title: String(milestone.title || 'Untitled milestone'),
      reason,
      priority: status === 'at_risk' ? 'high' : 'normal',
      score,
      estimatedMomentum: Math.max(10, Math.min(40, Math.round(score / 2))),
      deadline: deadline || undefined,
      progress,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private projectToSuggestion(project: any): DailyFocusMove {
    const projectId = String(project._id);
    const projectName = String(project.title || project.name || 'Untitled Project');

    return {
      id: `project_${projectId}_next_move`,
      sourceType: 'project',
      sourceId: new Types.ObjectId(projectId),
      projectId: project._id,
      projectName,
      title: `Define the next move for ${projectName}`,
      reason: 'This active project does not have a clear priority task yet.',
      priority: 'normal',
      score: 15,
      estimatedMomentum: 10,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private buildUserProjectQuery(userObjectId: Types.ObjectId): FilterQuery<ProjectDocument> {
    return {
      $and: [
        {
          $or: [
            { ownerId: userObjectId },
            { owner: userObjectId },
            { createdBy: userObjectId },
            { createdById: userObjectId },
            { userId: userObjectId },
            { members: userObjectId },
            { memberIds: userObjectId },
            { collaborators: userObjectId },
            { sharedWith: userObjectId },
            { 'members.userId': userObjectId },
            { 'members.user': userObjectId },
            { 'members.memberId': userObjectId },
          ],
        },
        {
          status: {
            $nin: [
              'archived',
              'deleted',
              'completed',
              'ARCHIVED',
              'DELETED',
              'COMPLETED',
            ],
          },
        },
      ],
    };
  }

  private findUserProjectById(
    userObjectId: Types.ObjectId,
    projectObjectId: Types.ObjectId,
  ) {
    return this.projectModel
      .findOne({
        _id: projectObjectId,
        ...this.buildUserProjectQuery(userObjectId),
      })
      .lean()
      .exec();
  }

  private getDateKey(_timezone = 'UTC'): string {
    // For now we use UTC for deterministic server behavior.
    // A later polish pass can calculate the user's local date from timezone.
    return new Date().toISOString().slice(0, 10);
  }

  private toObjectId(value: string, message: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(message);
    }

    return new Types.ObjectId(value);
  }

  private sameObjectId(value: any, compareTo: Types.ObjectId): boolean {
    if (!value || !compareTo) return false;

    const raw = value?._id || value;

    return String(raw) === String(compareTo);
  }
}

// src/sprints/sprints.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Sprint,
  SprintDocument,
  SprintStatus,
  BurndownPoint,
  SprintRetrospective,
} from './schemas/sprint.schema';
import {
  CreateSprintDto,
  UpdateSprintDto,
  SprintRetrospectiveDto,
  SprintQueryDto,
} from './dto/sprint.dto';

@Injectable()
export class SprintsService {
  private readonly logger = new Logger(SprintsService.name);

  constructor(
    @InjectModel(Sprint.name)
    private readonly sprintModel: Model<SprintDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateSprintDto): Promise<SprintDocument> {
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const sprintNumber = await this.getNextSprintNumber(dto.projectId);

    const plannedTasks = dto.taskIds?.length || 0;

    const sprint = new this.sprintModel({
      ...dto,
      sprintNumber,
      projectId: new Types.ObjectId(dto.projectId),
      createdBy: new Types.ObjectId(userId),
      taskIds: dto.taskIds?.map((id) => new Types.ObjectId(id)) || [],
      teamMembers: dto.teamMembers?.map((id) => new Types.ObjectId(id)) || [],
      metrics: {
        plannedPoints: 0,
        plannedTasks,
        completedPoints: 0,
        completedTasks: 0,
      },
    });

    const saved = await sprint.save();

    this.eventEmitter.emit('sprint.created', {
      sprintId: saved._id,
      projectId: dto.projectId,
      createdBy: userId,
    });

    this.logger.log(`Sprint created: ${saved.name} (#${sprintNumber})`);

    return saved;
  }

  async findById(sprintId: string): Promise<SprintDocument> {
    const sprint = await this.sprintModel
      .findById(sprintId)
      .populate('taskIds')
      .populate('teamMembers', 'firstName lastName avatar');

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return sprint;
  }

  async findByProject(
    projectId: string,
    query: SprintQueryDto = {},
  ): Promise<{ sprints: SprintDocument[]; total: number }> {
    const filter: any = { projectId: new Types.ObjectId(projectId) };

    if (query.status) {
      filter.status = query.status;
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const [sprints, total] = await Promise.all([
      this.sprintModel
        .find(filter)
        .populate('teamMembers', 'firstName lastName avatar')
        .sort({ sprintNumber: -1 })
        .skip(offset)
        .limit(limit),
      this.sprintModel.countDocuments(filter),
    ]);

    return { sprints, total };
  }

  async findActiveSprint(projectId: string): Promise<SprintDocument | null> {
    return this.sprintModel.findOne({
      projectId: new Types.ObjectId(projectId),
      status: SprintStatus.ACTIVE,
    });
  }

  async findCurrentOrUpcoming(projectId: string): Promise<SprintDocument | null> {
    let sprint = await this.findActiveSprint(projectId);
    
    if (!sprint) {
      sprint = await this.sprintModel
        .findOne({
          projectId: new Types.ObjectId(projectId),
          status: SprintStatus.PLANNING,
          startDate: { $gte: new Date() },
        })
        .sort({ startDate: 1 });
    }

    return sprint;
  }

  async update(sprintId: string, dto: UpdateSprintDto): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed sprint');
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(sprint, {
      ...dto,
      teamMembers: dto.teamMembers?.map((id) => new Types.ObjectId(id)),
    });

    return sprint.save();
  }

  async startSprint(sprintId: string, userId: string): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status !== SprintStatus.PLANNING) {
      throw new BadRequestException('Sprint can only be started from planning status');
    }

    const activeSprint = await this.findActiveSprint(sprint.projectId.toString());
    if (activeSprint) {
      throw new BadRequestException(
        `Cannot start sprint. "${activeSprint.name}" is already active.`,
      );
    }

    const plannedPoints = await this.calculateSprintPoints(sprint.taskIds);

    sprint.status = SprintStatus.ACTIVE;
    sprint.actualStartDate = new Date();
    sprint.metrics.plannedPoints = plannedPoints;
    sprint.metrics.plannedTasks = sprint.taskIds.length;

    sprint.addBurndownPoint({
      date: new Date(),
      remainingPoints: plannedPoints,
      remainingTasks: sprint.taskIds.length,
      completedPoints: 0,
      completedTasks: 0,
    });

    const saved = await sprint.save();

    this.eventEmitter.emit('sprint.started', {
      sprintId: saved._id,
      projectId: saved.projectId,
      startedBy: userId,
    });

    this.logger.log(`Sprint started: ${saved.name}`);

    return saved;
  }

  async completeSprint(
    sprintId: string,
    userId: string,
    retrospective?: SprintRetrospectiveDto,
  ): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status !== SprintStatus.ACTIVE && sprint.status !== SprintStatus.REVIEW) {
      throw new BadRequestException('Sprint must be active or in review to complete');
    }

    const { completedPoints, completedTasks } = await this.calculateCompletedMetrics(
      sprint.taskIds,
    );

    sprint.status = SprintStatus.COMPLETED;
    sprint.actualEndDate = new Date();
    sprint.metrics.completedPoints = completedPoints;
    sprint.metrics.completedTasks = completedTasks;
    sprint.metrics.velocity = completedPoints;
    sprint.metrics.capacityUtilization = sprint.capacityHours > 0
      ? Math.round((completedPoints / sprint.metrics.plannedPoints) * 100)
      : 0;

    if (retrospective) {
      const retro: SprintRetrospective = {
        wentWell: retrospective.wentWell || [],
        needsImprovement: retrospective.needsImprovement || [],
        actionItems: retrospective.actionItems || [],
        teamMorale: retrospective.teamMorale,
        notes: retrospective.notes,
        completedAt: new Date(),
      };
      sprint.retrospective = retro;
    }

    sprint.addBurndownPoint({
      date: new Date(),
      remainingPoints: sprint.metrics.plannedPoints - completedPoints,
      remainingTasks: sprint.taskIds.length - completedTasks,
      completedPoints,
      completedTasks,
    });

    const goalsAchieved = sprint.goals.every((g) => g.isAchieved);

    const saved = await sprint.save();

    this.eventEmitter.emit('sprint.completed', {
      sprintId: saved._id,
      projectId: saved.projectId,
      completedBy: [userId],
      goalAchieved: goalsAchieved,
      velocity: completedPoints,
    });

    this.logger.log(`Sprint completed: ${saved.name} (velocity: ${completedPoints})`);

    return saved;
  }

  async moveToReview(sprintId: string): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Sprint must be active to move to review');
    }

    sprint.status = SprintStatus.REVIEW;
    return sprint.save();
  }

  async cancelSprint(sprintId: string, userId: string): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed sprint');
    }

    sprint.status = SprintStatus.CANCELLED;
    sprint.actualEndDate = new Date();

    const saved = await sprint.save();

    this.eventEmitter.emit('sprint.cancelled', {
      sprintId: saved._id,
      projectId: saved.projectId,
      cancelledBy: userId,
    });

    return saved;
  }

  async addTasks(sprintId: string, taskIds: string[]): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot add tasks to completed sprint');
    }

    let addedCount = 0;
    for (const taskId of taskIds) {
      const added = sprint.addTask(new Types.ObjectId(taskId));
      if (added) {
        addedCount++;
      }
    }

    if (addedCount > 0) {
      const newPoints = await this.calculateSprintPoints(
        taskIds.map((id) => new Types.ObjectId(id)),
      );
      sprint.metrics.addedPoints += newPoints;
      sprint.metrics.addedTasks += addedCount;
      sprint.metrics.plannedTasks = sprint.taskIds.length;
    }

    return sprint.save();
  }

  async removeTask(sprintId: string, taskId: string): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot remove tasks from completed sprint');
    }

    const removed = sprint.removeTask(new Types.ObjectId(taskId));
    if (removed) {
      sprint.metrics.plannedTasks = sprint.taskIds.length;
    }

    return sprint.save();
  }

  async getBurndownData(sprintId: string): Promise<{
    sprint: SprintDocument;
    idealBurndown: { date: Date; points: number }[];
    actualBurndown: { date: Date; points: number }[];
    projectedCompletion?: Date;
  }> {
    const sprint = await this.findById(sprintId);

    const totalDays = Math.ceil(
      (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const pointsPerDay = sprint.metrics.plannedPoints / totalDays;

    const idealBurndown: { date: Date; points: number }[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(sprint.startDate);
      date.setDate(date.getDate() + i);
      idealBurndown.push({
        date,
        points: Math.max(0, sprint.metrics.plannedPoints - pointsPerDay * i),
      });
    }

    const actualBurndown = sprint.burndown.map((b) => ({
      date: b.date,
      points: b.remainingPoints,
    }));

    let projectedCompletion: Date | undefined;
    if (sprint.status === SprintStatus.ACTIVE && actualBurndown.length >= 2) {
      const recent = actualBurndown.slice(-2);
      const velocity = recent[0].points - recent[1].points;
      if (velocity > 0) {
        const remaining = recent[1].points;
        const daysToComplete = Math.ceil(remaining / velocity);
        projectedCompletion = new Date();
        projectedCompletion.setDate(projectedCompletion.getDate() + daysToComplete);
      }
    }

    return {
      sprint,
      idealBurndown,
      actualBurndown,
      projectedCompletion,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateAllBurndowns(): Promise<void> {
    const activeSprints = await this.sprintModel.find({
      status: SprintStatus.ACTIVE,
    });

    for (const sprint of activeSprints) {
      const { completedPoints, completedTasks } = await this.calculateCompletedMetrics(
        sprint.taskIds,
      );

      sprint.addBurndownPoint({
        date: new Date(),
        remainingPoints: sprint.metrics.plannedPoints - completedPoints,
        remainingTasks: sprint.taskIds.length - completedTasks,
        completedPoints,
        completedTasks,
      });

      sprint.metrics.completedPoints = completedPoints;
      sprint.metrics.completedTasks = completedTasks;

      await sprint.save();
    }

    this.logger.log(`Updated burndown for ${activeSprints.length} active sprints`);
  }

  async getProjectVelocity(
    projectId: string,
    sprintCount: number = 5,
  ): Promise<{
    averageVelocity: number;
    sprintVelocities: { sprintId: string; sprintName: string; velocity: number; sprintNumber: number }[];
    trend: 'improving' | 'stable' | 'declining';
  }> {
    const completedSprints = await this.sprintModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: SprintStatus.COMPLETED,
      })
      .sort({ endDate: -1 })
      .limit(sprintCount)
      .select('_id name sprintNumber metrics.velocity');

    if (completedSprints.length === 0) {
      return {
        averageVelocity: 0,
        sprintVelocities: [],
        trend: 'stable',
      };
    }

    const sprintVelocities = completedSprints.map((s) => ({
      sprintId: s._id.toString(),
      sprintName: s.name,
      sprintNumber: s.sprintNumber,
      velocity: s.metrics?.velocity || 0,
    }));

    const totalVelocity = sprintVelocities.reduce((sum, s) => sum + s.velocity, 0);
    const averageVelocity = Math.round(totalVelocity / sprintVelocities.length);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (sprintVelocities.length >= 3) {
      const recent = sprintVelocities.slice(0, 2);
      const older = sprintVelocities.slice(-2);
      const recentAvg = (recent[0].velocity + recent[1].velocity) / 2;
      const olderAvg = (older[0].velocity + older[1].velocity) / 2;
      
      if (recentAvg > olderAvg * 1.1) trend = 'improving';
      else if (recentAvg < olderAvg * 0.9) trend = 'declining';
    }

    return {
      averageVelocity,
      sprintVelocities: sprintVelocities.reverse(),
      trend,
    };
  }

  async updateRetrospective(
    sprintId: string,
    dto: SprintRetrospectiveDto,
  ): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (sprint.status !== SprintStatus.REVIEW && sprint.status !== SprintStatus.COMPLETED) {
      throw new BadRequestException('Retrospective can only be added in review or after completion');
    }

    const retro: SprintRetrospective = {
      wentWell: dto.wentWell || sprint.retrospective?.wentWell || [],
      needsImprovement: dto.needsImprovement || sprint.retrospective?.needsImprovement || [],
      actionItems: dto.actionItems || sprint.retrospective?.actionItems || [],
      teamMorale: dto.teamMorale ?? sprint.retrospective?.teamMorale,
      notes: dto.notes ?? sprint.retrospective?.notes,
      completedAt: new Date(),
    };
    sprint.retrospective = retro;

    return sprint.save();
  }

  async updateGoalProgress(
    sprintId: string,
    goalIndex: number,
    progress: number,
  ): Promise<SprintDocument> {
    const sprint = await this.findById(sprintId);

    if (!sprint.goals[goalIndex]) {
      throw new BadRequestException('Goal not found');
    }

    sprint.updateGoalProgress(goalIndex, progress);
    return sprint.save();
  }

  private async getNextSprintNumber(projectId: string): Promise<number> {
    const lastSprint = await this.sprintModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ sprintNumber: -1 })
      .select('sprintNumber');
    return (lastSprint?.sprintNumber || 0) + 1;
  }

  private async calculateSprintPoints(taskIds: Types.ObjectId[]): Promise<number> {
    return taskIds.length * 3;
  }

  private async calculateCompletedMetrics(
    taskIds: Types.ObjectId[],
  ): Promise<{ completedPoints: number; completedTasks: number }> {
    return {
      completedPoints: 0,
      completedTasks: 0,
    };
  }

  async delete(sprintId: string): Promise<void> {
    const sprint = await this.findById(sprintId);

    if (sprint.status === SprintStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active sprint. Cancel it first.');
    }

    await this.sprintModel.findByIdAndDelete(sprintId);
    this.logger.log(`Sprint deleted: ${sprint.name}`);
  }
}

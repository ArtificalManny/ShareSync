// src/milestones/milestones.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Milestone, MilestoneDocument } from './schemas/milestone.schema';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectModel(Milestone.name) private milestoneModel: Model<MilestoneDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(userId: string, dto: CreateMilestoneDto): Promise<MilestoneDocument> {
    const milestone = new this.milestoneModel({
      ...dto,
      projectId: new Types.ObjectId(dto.projectId),
      createdBy: new Types.ObjectId(userId),
      status: 'planned',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
    });

    return milestone.save();
  }

  async findById(id: string): Promise<MilestoneDocument> {
    const milestone = await this.milestoneModel.findById(id);
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    return milestone;
  }

  async findByProject(projectId: string): Promise<MilestoneDocument[]> {
    return this.milestoneModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ targetDate: 1 })
      .exec();
  }

  async update(id: string, userId: string, dto: UpdateMilestoneDto): Promise<MilestoneDocument> {
    const milestone = await this.findById(id);
    
    // Update fields
    Object.assign(milestone, dto);
    
    // Auto-update status based on progress
    if (dto.progress !== undefined) {
      if (dto.progress >= 100) {
        milestone.status = 'completed';
        milestone.completedAt = new Date();
      } else if (dto.progress >= 60) {
        milestone.status = 'in_progress';
      }
    }

    return milestone.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const milestone = await this.findById(id);
    await this.milestoneModel.deleteOne({ _id: milestone._id });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TASK LINKING
  // ═══════════════════════════════════════════════════════════════════════════════

  async linkTask(milestoneId: string, taskId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);
    
    const taskObjectId = new Types.ObjectId(taskId);
    
    // Check if already linked
    if (milestone.taskIds.some(id => id.equals(taskObjectId))) {
      return milestone;
    }

    milestone.taskIds.push(taskObjectId);
    milestone.totalTasks = milestone.taskIds.length;
    
    return milestone.save();
  }

  async unlinkTask(milestoneId: string, taskId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);
    
    const taskObjectId = new Types.ObjectId(taskId);
    milestone.taskIds = milestone.taskIds.filter(id => !id.equals(taskObjectId));
    milestone.totalTasks = milestone.taskIds.length;
    
    // Recalculate progress
    await this.recalculateProgress(milestoneId);
    
    return milestone.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROGRESS TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  async recalculateProgress(milestoneId: string): Promise<MilestoneDocument> {
    const milestone = await this.findById(milestoneId);
    
    if (milestone.totalTasks === 0) {
      milestone.progress = 0;
    } else {
      milestone.progress = Math.round((milestone.completedTasks / milestone.totalTasks) * 100);
    }

    // Update status based on progress and date
    const now = new Date();
    const targetDate = new Date(milestone.targetDate);
    
    if (milestone.progress >= 100) {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
    } else if (milestone.progress > 0) {
      // Check if at risk (less than 80% progress and target date is within 7 days)
      const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = Math.max(0, 100 - (daysUntilTarget * 5)); // Rough estimate
      
      if (milestone.progress < expectedProgress * 0.8) {
        milestone.status = 'at_risk';
      } else {
        milestone.status = 'in_progress';
      }
    } else {
      milestone.status = 'planned';
    }

    return milestone.save();
  }

  async incrementCompletedTasks(milestoneId: string): Promise<MilestoneDocument> {
    await this.milestoneModel.updateOne(
      { _id: milestoneId },
      { $inc: { completedTasks: 1 } }
    );
    return this.recalculateProgress(milestoneId);
  }

  async decrementCompletedTasks(milestoneId: string): Promise<MilestoneDocument> {
    await this.milestoneModel.updateOne(
      { _id: milestoneId },
      { $inc: { completedTasks: -1 } }
    );
    return this.recalculateProgress(milestoneId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  async findUpcoming(projectId: string, days: number = 30): Promise<MilestoneDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        targetDate: { $lte: futureDate },
        status: { $ne: 'completed' },
      })
      .sort({ targetDate: 1 })
      .exec();
  }

  async findAtRisk(projectId: string): Promise<MilestoneDocument[]> {
    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: 'at_risk',
      })
      .sort({ targetDate: 1 })
      .exec();
  }

  async findCompleted(projectId: string): Promise<MilestoneDocument[]> {
    return this.milestoneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: 'completed',
      })
      .sort({ completedAt: -1 })
      .exec();
  }
}

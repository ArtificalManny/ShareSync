// backend/src/momentum/momentum.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { AuditService } from '../audit/audit.service';

interface LeaderboardEntry {
  userId: string;
  username: string;
  streakDays: number;
  xp: number;
}

@Injectable()
export class MomentumService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly audit: AuditService,
  ) {}

  async shipProject(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.shippedAt = new Date();
    await project.save();

    const user = await this.userModel.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + 250;
      user.streakDays = (user.streakDays || 0) + 1;
      await user.save();
    }

    await this.audit.log({               // ← fixed: audit.log exists
      userId,
      action: 'project_shipped',
      entity: 'Project',
      entityId: projectId,
      metadata: { title: project.title },
    });

    return { shipped: true };
  }

  async getStreak(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).select('streakDays').lean();
    return user?.streakDays ?? 0;
  }

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const users = await this.userModel
      .find({}, { username: 1, streakDays: 1, xp: 1 })
      .sort({ streakDays: -1, xp: -1 })
      .limit(limit)
      .lean();

    return users.map(u => ({
      userId: u._id.toString(),
      username: u.username,
      streakDays: u.streakDays || 0,
      xp: u.xp || 0,
    }));
  }

  async getMomentumScore(userId: string): Promise<number> {
    const [projects, tasks] = await Promise.all([
      this.projectModel.countDocuments({ userId }),
      this.taskModel.countDocuments({ createdBy: userId, completedAt: { $exists: true } }),
    ]);

    return projects * 100 + tasks * 10;
  }
}
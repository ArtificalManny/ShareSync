// src/momentum/momentum.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MomentumService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private auditService: AuditService,
  ) {}

  async getStreak(userId: string) {
    const tasks = await this.taskModel
      .find({ assigneeId: userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .select('completedAt')
      .lean();

    if (!tasks.length) return { streak: 0, resetAt: null };

    const today = new Date().setHours(0, 0, 0, 0);
    let streak = 0;
    let current = new Date(today);

    for (const task of tasks) {
      if (!task.completedAt) continue;
      const day = new Date(task.completedAt).setHours(0, 0, 0, 0);
      if (day === current.getTime()) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else if (day < current.getTime()) {
        break;
      }
    }

    const resetAt = new Date(today + 24 * 60 * 60 * 1000);
    return { streak, resetAt };
  }

  async getLeaderboard(limit = 10) {
    const users = await this.userModel
      .aggregate([
        {
          $lookup: {
            from: 'tasks',
            localField: '_id',
            foreignField: 'assigneeId',
            as: 'tasks',
          },
        },
        {
          $project: {
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            username: 1,
            profilePicture: 1,
            xp: 1,
            taskCount: {
              $size: {
                $filter: {
                  input: '$tasks',
                  cond: { $eq: ['$$this.status', 'completed'] },
                },
              },
            },
          },
        },
        { $sort: { xp: -1, taskCount: -1 } },
        { $limit: limit },
      ])
      .exec();

    return users.map((u, i) => ({
      userId: u._id,
      name: u.name.trim() || u.username,
      avatar: u.profilePicture,
      xp: u.xp || 0,
      streak: 0,
    }));
  }

  async getMomentumScore(userId: string) {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const tasks = await this.taskModel
      .find({
        assigneeId: userId,
        $or: [
          { createdAt: { $gte: new Date(weekAgo) } },
          { completedAt: { $gte: new Date(weekAgo) } },
        ],
      })
      .select('status')
      .lean();

    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const total = tasks.length || 1;

    const velocity = completed / total;
    const recency = tasks.length > 0 ? 1 : 0;

    const score = Math.round((velocity * 70) + (recency * 30));
    return { score };
  }

  async shipProject(projectId: string, userId: string) {
    const project = await this.projectModel.findByIdAndUpdate(
      projectId,
      { status: 'shipped', shippedAt: new Date(), shippedBy: userId },
      { new: true },
    );

    if (!project) throw new Error('Project not found');

    await this.auditService.logProjectShipped(projectId, userId, project);

    return project;
  }
}
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './task.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel('Task') private taskModel: Model<Task>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(projectId: string, title: string, description: string, creatorId: string, assignedTo?: string, dueDate?: string) {
    const task = new this.taskModel({
      projectId,
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    const savedTask = await task.save();
    if (assignedTo) {
      this.notificationsGateway.sendNotification(assignedTo, {
        message: `You have been assigned a new task: "${title}"`,
        timestamp: new Date(),
        read: false,
        type: 'task-assigned',
        relatedId: savedTask._id,
      });
    }
    return savedTask;
  }

  async getCompletedTasks(projectId: string) {
    return this.taskModel.find({ projectId, status: 'completed' }).exec();
  }

  async assignTask(taskId: string, assignedTo: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    task.assignedTo = assignedTo;
    task.status = 'in-progress';
    const updatedTask = await task.save();
    if (assignedTo) {
      this.notificationsGateway.sendNotification(assignedTo, {
        message: `You have been assigned a new task: "${task.title}"`,
        timestamp: new Date(),
        read: false,
        type: 'task-assigned',
        relatedId: taskId,
      });
    }
    return updatedTask;
  }

  async completeTask(taskId: string, completedBy: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    task.status = 'completed';
    task.completedBy = completedBy;
    task.completedAt = new Date();
    const updatedTask = await task.save();
    if (task.assignedTo) {
      this.notificationsGateway.sendNotification(task.assignedTo, {
        message: `Task "${task.title}" has been completed by ${completedBy}`,
        timestamp: new Date(),
        read: false,
        type: 'task-completed',
        relatedId: taskId,
      });
    }
    return updatedTask;
  }

  async getProjectTasks(projectId: string) {
    return this.taskModel.find({ projectId }).exec();
  }

  async getProjectProgress(projectId: string): Promise<number> {
    const totalTasks = await this.taskModel.countDocuments({ projectId });
    const completedTasks = await this.taskModel.countDocuments({ projectId, status: 'completed' });
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }
}
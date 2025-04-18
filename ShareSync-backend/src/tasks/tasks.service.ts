import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../task.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel('Task') private taskModel: Model<Task>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async createTask(projectId: string, title: string, description: string, createdBy: string) {
    const task = new this.taskModel({
      projectId,
      title,
      description,
      createdBy,
      isCompleted: false,
    });
    await task.save();
    // Notify the project creator
    const creator = await this.usersService.findOneById(createdBy);
    if (creator) {
      await this.notificationsService.createNotification(
        createdBy,
        `New task "${title}" created in project ${projectId}`,
        'task_created',
        task._id.toString(),
      );
    }
    return task;
  }

  async completeTask(taskId: string, completedBy: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new Error('Task not found');
    }
    task.isCompleted = true;
    task.completedBy = completedBy;
    task.completedAt = new Date();
    await task.save();
    // Notify the project creator and the user who completed the task
    const creator = await this.usersService.findOneById(task.createdBy);
    const completer = await this.usersService.findOneById(completedBy);
    if (creator) {
      await this.notificationsService.createNotification(
        task.createdBy,
        `${completer?.email} completed task "${task.title}" in project ${task.projectId}`,
        'task_completed',
        taskId,
      );
    }
    if (completer) {
      await this.notificationsService.createNotification(
        completedBy,
        `You completed task "${task.title}" in project ${task.projectId}`,
        'task_completed',
        taskId,
      );
    }
    return task;
  }

  async getCompletedTasks() {
    return this.taskModel.find({ isCompleted: true }).exec();
  }
}
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel('Task') private taskModel: Model<Task>) {}

  async createTask(projectId: string, title: string, description: string): Promise<Task> {
    const task = new this.taskModel({ projectId, title, description });
    return task.save();
  }

  async getTasks(projectId: string): Promise<Task[]> {
    return this.taskModel.find({ projectId }).exec();
  }

  async updateTask(taskId: string, update: Partial<Task>): Promise<Task | null> {
    return this.taskModel.findByIdAndUpdate(taskId, update, { new: true }).exec();
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.taskModel.findByIdAndDelete(taskId).exec();
  }
}
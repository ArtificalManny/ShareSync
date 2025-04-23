import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const createdTask = new this.taskModel(taskData);
    return createdTask.save();
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.taskModel.find({ projectId }).exec();
  }

  async updateTask(id: string, updateData: Partial<Task>): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    Object.assign(task, updateData);
    return task.save();
  }

  async deleteTask(id: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
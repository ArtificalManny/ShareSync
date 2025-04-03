import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(projectId: string, name: string, description: string, assignee: string, dueDate: string) {
    try {
      const task = new this.taskModel({
        projectId,
        name,
        description,
        assignee,
        dueDate,
      });
      return await task.save();
    } catch (error) {
      console.error('Error in create task:', error);
      throw error;
    }
  }

  async findByProject(projectId: string) {
    try {
      return await this.taskModel.find({ projectId }).exec();
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<TaskDocument>) {
    try {
      const updatedTask = await this.taskModel.findByIdAndUpdate(id, updates, { new: true }).exec();
      if (!updatedTask) {
        throw new Error('Task not found');
      }
      return updatedTask;
    } catch (error) {
      console.error('Error in update task:', error);
      throw error;
    }
  }
}
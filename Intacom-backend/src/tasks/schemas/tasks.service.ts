import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(projectId: string, name: string, description: string, assignee: string, dueDate: string) {
    const task = new this.taskModel({
      projectId,
      name,
      description,
      assignee,
      dueDate,
    });
    return task.save();
  }

  async findByProject(projectId: string) {
    return this.taskModel.find({ projectId }).exec();
  }

  async update(id: string, updates: Partial<Task>) {
    return this.taskModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }
}
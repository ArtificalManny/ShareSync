// backend/src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';

export type CreateTaskDto = {
  title: string;
  status?: TaskStatus;
  description?: string;
  dueDate?: string | Date | null;
  assigneeId?: string;
  labels?: string[];
  notes?: string;
};

export type PatchTaskDto = Partial<CreateTaskDto>;

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(projectId: string, createdBy: string, dto: CreateTaskDto) {
    const t = new this.taskModel({
      title: (dto.title || '').trim(),
      status: dto.status || 'todo',
      description: dto.description ?? '',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assigneeId: dto.assigneeId || undefined,
      labels: Array.isArray(dto.labels) ? dto.labels : [],
      notes: dto.notes,
      projectId,
      createdBy,
      watchers: [],
    });
    return t.save();
  }

  async list(projectId: string, limit = 50, cursor?: string | null) {
    const q: FilterQuery<TaskDocument> = { projectId };
    const find = this.taskModel
      .find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Math.max(1, limit)));

    if (cursor && Types.ObjectId.isValid(cursor)) {
      find.where({ _id: { $lt: new Types.ObjectId(cursor) } });
    }

    const items = await find.lean();
    const nextCursor = items.length ? String((items[items.length - 1] as any)?._id) : null;
    return { items, nextCursor };
  }

  async patch(projectId: string, taskId: string, patch: PatchTaskDto) {
    if (!Types.ObjectId.isValid(taskId)) throw new NotFoundException('Task not found');
    const update: any = {};

    if (typeof patch.title === 'string') update.title = patch.title.trim();
    if (typeof patch.status === 'string') update.status = patch.status;
    if (typeof patch.description === 'string') update.description = patch.description;

    if (patch.dueDate !== undefined) {
      update.dueDate = patch.dueDate ? new Date(patch.dueDate as any) : undefined;
    }

    if (typeof patch.assigneeId === 'string' || patch.assigneeId === null) {
      update.assigneeId = patch.assigneeId || undefined;
    }

    if (Array.isArray(patch.labels)) update.labels = patch.labels;
    if (typeof patch.notes === 'string' || patch.notes === null) {
      update.notes = patch.notes || undefined;
    }

    update.updatedAt = new Date();

    const doc = await this.taskModel.findOneAndUpdate(
      { _id: taskId, projectId },
      { $set: update },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Task not found');
    return doc.toObject();
  }
}
// /backend/src/projects/project.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RealtimeService } from '../realtime/realtime.service';

type ProjectDoc = any; // keep loose to avoid TS unions from .lean()

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel('Project') private readonly projectModel: Model<ProjectDoc>,
    private readonly realtime: RealtimeService,
  ) {}

  // ---------- CREATE ----------
  async create(body: any, ownerId: string) {
    const now = new Date();
    const doc = await this.projectModel.create({
      title: body.title,
      description: body.description,
      category: body.category ?? '',
      status: body.status ?? 'Not Started',
      privacy: body.privacy ?? 'Private',
      members: body.members ?? [],
      userId: ownerId || 'defaultUserId',
      lastActivityAt: now,
      updates: [],
      tasks: [],
    });
    const obj = doc.toObject();
    // optional: notify owner
    this.realtime.userEmit(obj.userId, 'project:created', { projectId: String(obj._id) });
    return obj;
  }

  // ---------- READ ----------
  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid id');
    const doc = await this.projectModel.findById(id).lean<ProjectDoc>();
    if (!doc) throw new NotFoundException('Project not found');
    return doc;
  }

  // List for the current user (used by /api/projects and Projects.jsx)
  async listForUser(userId: string) {
    const items = await this.projectModel
      .find({ userId })
      .select({
        title: 1,
        description: 1,
        status: 1,
        privacy: 1,
        avatar: 1,
        updatedAt: 1,
        createdAt: 1,
        lastActivityAt: 1,
        members: 1,
      })
      .sort({ updatedAt: -1 })
      .lean<ProjectDoc[]>();

    return Array.isArray(items) ? items : [];
  }

  // Quick rail list (compact)
  async listQuick(ownerId: string) {
    const items = await this.projectModel
      .find({ userId: ownerId })
      .select({ title: 1, lastActivityAt: 1, avatar: 1 })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean<ProjectDoc[]>();

    return (items ?? []).map((p: any) => ({
      _id: p._id,
      title: p.title,
      avatar: p.avatar ?? null,
      lastActivityAt: p.lastActivityAt,
      unreadCount: 0,
    }));
  }

  // ---------- FEED ----------
  async getFeed(id: string, limit = 20, cursor?: string) {
    const proj = (await this.findById(id)) as any;
    let updates: any[] = Array.isArray(proj?.updates) ? proj.updates : [];

    if (cursor && Types.ObjectId.isValid(cursor)) {
      const idx = updates.findIndex((u) => String(u._id) === cursor);
      if (idx >= 0) updates = updates.slice(idx + 1);
    }

    const trimmed = updates.slice(-limit).reverse();
    const nextCursor =
      updates.length > limit
        ? String(updates[updates.length - limit - 1]?._id || '')
        : null;

    return { items: trimmed, nextCursor };
  }

  async addUpdate(id: string, body: any, userId: string) {
    if (!body?.text?.trim()) throw new BadRequestException('text required');

    const updId = new Types.ObjectId();
    const now = new Date();
    const res = await this.projectModel.findByIdAndUpdate(
      id,
      {
        $push: {
          updates: {
            _id: updId,
            text: body.text,
            mentions: body.mentions ?? [],
            files: body.files ?? [],
            userId,
            createdAt: now,
          },
        },
        $set: { lastActivityAt: now },
      },
      { new: true }
    );
    if (!res) throw new NotFoundException('Project not found');

    const created = {
      _id: updId,
      text: body.text,
      mentions: body.mentions ?? [],
      files: body.files ?? [],
      userId,
      createdAt: now,
    };

    this.realtime.projectEmit(id, 'project:update', { projectId: id, update: created });
    return created;
  }

  // ---------- TASKS ----------
  async addTask(id: string, body: any) {
    if (!body?.title?.trim()) throw new BadRequestException('title required');

    const taskId = new Types.ObjectId();
    const payload = {
      _id: taskId,
      title: body.title,
      status: body.status ?? 'Not Started',
      assigneeId: body.assigneeId ?? '',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdAt: new Date(),
    };

    const res = await this.projectModel.findByIdAndUpdate(
      id,
      {
        $push: { tasks: payload },
        $set: { lastActivityAt: new Date() },
      },
      { new: true }
    );
    if (!res) throw new NotFoundException('Project not found');

    this.realtime.projectEmit(id, 'task:created', { projectId: id, task: payload });
    if (payload.assigneeId) {
      this.realtime.userEmit(payload.assigneeId, 'task:assigned', { projectId: id, task: payload });
    }
    return payload;
  }

  async patchTask(id: string, taskId: string, body: any) {
    const projDoc = await this.projectModel.findById(id);
    if (!projDoc) throw new NotFoundException('Project not found');

    const t: any = (projDoc as any).tasks?.id(taskId);
    if (!t) throw new NotFoundException('Task not found');

    let changedDue = false;
    let completedNow = false;

    if (body.status && body.status !== t.status) {
      completedNow = body.status === 'Completed';
      t.status = body.status;
    }
    if (typeof body.assigneeId === 'string') t.assigneeId = body.assigneeId;
    if (body.dueDate) {
      t.dueDate = new Date(body.dueDate);
      changedDue = true;
    }

    (projDoc as any).lastActivityAt = new Date();
    await projDoc.save();

    const out = t.toObject ? t.toObject() : t;

    this.realtime.projectEmit(id, 'task:updated', { projectId: id, task: out });
    if (completedNow) this.realtime.projectEmit(id, 'task:completed', { projectId: id, task: out });
    if (changedDue) this.realtime.projectEmit(id, 'task:due_changed', { projectId: id, task: out });

    return out;
  }

  // ---------- KPIs (placeholder) ----------
  async getKpis(id: string) {
    const proj = await this.findById(id);
    const tasks = Array.isArray((proj as any).tasks) ? (proj as any).tasks : [];
    const done = tasks.filter((t: any) => t.status === 'Completed').length;
    const total = tasks.length || 1;

    return {
      tasksDone: done,
      onTimePct: 90,               // placeholder
      activeDays28d: 7,            // placeholder
      velocity7d: Math.min(done, 7), // placeholder
    };
  }

  // ---------- SHIMS FOR LEGACY CALL SITES ----------
  async findOne(id: string) {
    return this.findById(id);
  }

  async findAll(userId: string) {
    return this.projectModel.find({ userId }).lean<ProjectDoc[]>();
  }

  // Invite helper
  emitInviteAccepted(projectId: string, userId: string) {
    this.realtime.projectEmit(projectId, 'invite:accepted', { projectId, userId });
    this.realtime.userEmit(userId, 'invite:accepted', { projectId, userId });
  }
}
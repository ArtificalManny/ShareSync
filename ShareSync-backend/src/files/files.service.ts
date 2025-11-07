// backend/src/files/files.service.ts
import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { File, FileDocument, FileStatus } from './schemas/file.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type CreateFileInput = {
  storageKey: string;
  url?: string;
  thumbKey?: string;
  thumbUrl?: string;
  name: string;
  size: number;
  mime: string;
  kind?: 'image' | 'video' | 'doc' | 'audio' | 'other';
  projectId: string;
  status?: FileStatus;
  moderation?: { reason?: string; tags?: string[] };
};

type ListOpts = { cursor?: string | null; limit?: number | null };

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @Inject('REALTIME_GATEWAY') private readonly realtime: RealtimeGateway,   // ← FIXED
  ) {}

  /** Resolve a user's role in a project. */
  private async getUserRole(projectId: string, userId: string): Promise<'owner' | 'member' | 'viewer' | null> {
    if (!Types.ObjectId.isValid(projectId)) return null;
    const proj = await this.projectModel
      .findById(projectId)
      .select({ userId: 1, members: 1 })
      .lean();

    if (!proj) return null;
    if (String(proj.userId) === String(userId)) return 'owner';
    const m = (proj.members || []).find((x: any) => x?.userId && String(x.userId) === String(userId));
    return (m?.role as any) || null;
  }

  private async assertCanView(projectId: string, userId: string) {
    const role = await this.getUserRole(projectId, userId);
    if (!role) throw new ForbiddenException('You do not have access to this project.');
  }

  private async assertCanEdit(projectId: string, userId: string) {
    const role = await this.getUserRole(projectId, userId);
    if (!role || (role !== 'owner' && role !== 'member')) {
      throw new ForbiddenException('You do not have permission to add/remove files.');
    }
  }

  /** FE-facing shape */
  private toPublic(d: File | (File & { _id?: any })) {
    const anyd: any = typeof (d as any).toObject === 'function' ? (d as any).toObject() : d;
    return {
      id: String(anyd._id ?? ''),
      storageKey: anyd.storageKey,
      url: anyd.url,
      thumbKey: anyd.thumbKey,
      thumbUrl: anyd.thumbUrl,
      name: anyd.name,
      size: Number(anyd.size || 0),
      mime: anyd.mime,
      kind: anyd.kind,
      projectId: anyd.projectId,
      uploaderId: anyd.uploaderId,
      status: anyd.status as FileStatus,
      moderation: anyd.moderation || undefined,
      createdAt: anyd.createdAt,
    };
  }

  /** Create a single file record and emit realtime. */
  async createOne(input: CreateFileInput, actingUserId: string) {
    await this.assertCanEdit(input.projectId, actingUserId);

    const doc = await this.fileModel.create({
      storageKey: input.storageKey,
      url: input.url,
      thumbKey: input.thumbKey,
      thumbUrl: input.thumbUrl,
      name: input.name,
      size: input.size,
      mime: input.mime,
      kind: input.kind || 'other',
      projectId: input.projectId,
      uploaderId: actingUserId,
      status: input.status ?? 'approved',
      moderation: input.moderation,
    });

    try {
      this.realtime.emitToProject(input.projectId, 'project:filesAdded', {
        projectId: input.projectId,
        files: [this.toPublic(doc)],
      });
    } catch { /* ignore */ }

    return this.toPublic(doc);
  }

  /** Bulk create and emit in one payload. */
  async createMany(projectId: string, items: CreateFileInput[], actingUserId: string) {
    await this.assertCanEdit(projectId, actingUserId);

    const docs = await this.fileModel.insertMany(
      (items || []).map((i) => ({
        storageKey: i.storageKey,
        url: i.url,
        thumbKey: i.thumbKey,
        thumbUrl: i.thumbUrl,
        name: i.name,
        size: i.size,
        mime: i.mime,
        kind: i.kind || 'other',
        projectId,
        uploaderId: actingUserId,
        status: i.status ?? 'approved',
        moderation: i.moderation,
      })),
      { ordered: false },
    );

    const payload = docs.map((d) => this.toPublic(d));
    try {
      this.realtime.emitToProject(projectId, 'project:filesAdded', { projectId, files: payload });
    } catch { /* ignore */ }

    return payload;
  }

  /** Paginated list by project (cursor = last seen _id; newest first). */
  async listByProject(projectId: string, actingUserId: string, opts: ListOpts = {}) {
    await this.assertCanView(projectId, actingUserId);

    const limit = Math.min(Math.max(Number(opts.limit ?? 20), 1), 100);
    const q: FilterQuery<FileDocument> = { projectId };

    if (opts.cursor && Types.ObjectId.isValid(String(opts.cursor))) {
      q._id = { $lt: new Types.ObjectId(String(opts.cursor)) };
    }

    const docs = await this.fileModel
      .find(q)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const items = slice.map((d) => this.toPublic(d as any));
    const nextCursor = hasMore ? String(slice[slice.length - 1]._id) : null;

    return { items, nextCursor };
  }

  async remove(fileId: string, actingUserId: string) {
    if (!Types.ObjectId.isValid(fileId)) throw new NotFoundException('File not found');
    const doc = await this.fileModel.findById(fileId);
    if (!doc) throw new NotFoundException('File not found');

    await this.assertCanEdit(doc.projectId, actingUserId);

    await this.fileModel.deleteOne({ _id: doc._id });

    try {
      this.realtime.emitToProject(doc.projectId, 'project:filesRemoved', {
        projectId: doc.projectId,
        fileIds: [String(doc._id)],
      });
    } catch { /* ignore */ }

    return { ok: true };
  }

  /** Optional moderation API */
  async updateStatus(fileId: string, status: FileStatus, reason?: string) {
    if (!Types.ObjectId.isValid(fileId)) throw new NotFoundException('File not found');
    const doc = await this.fileModel.findById(fileId);
    if (!doc) throw new NotFoundException('File not found');

    doc.status = status;
    doc.moderation = { ...(doc.moderation || {}), reason };
    await doc.save();

    return this.toPublic(doc);
  }
}
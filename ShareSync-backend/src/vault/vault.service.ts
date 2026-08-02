import { Injectable, HttpException, HttpStatus, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { VaultFolder, VaultFolderDocument } from './schemas/vault-folder.schema';
import { VaultFile, VaultFileDocument } from './schemas/vault-file.schema';
import {
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema';
import {
  Milestone,
  MilestoneDocument,
} from '../milestones/schemas/milestone.schema';
import {
  Announcement,
  AnnouncementDocument,
} from '../announcements/schemas/announcements.schema';
import {
  Thread,
  ThreadDocument,
} from '../threads/schemas/thread.schema';
import {
  ThreadMessage,
  ThreadMessageDocument,
} from '../threads/schemas/thread-message.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';

// Standard Free Tier Limit: 5GB (in bytes)
const PROJECT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

type VaultBacklinkCounts = {
  moves: number;
  milestones: number;
  announcements: number;
  teamRoomMessages: number;
  total: number;
};

const createEmptyVaultBacklinks =
  (): VaultBacklinkCounts => ({
    moves: 0,
    milestones: 0,
    announcements: 0,
    teamRoomMessages: 0,
    total: 0,
  });

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(
    @InjectModel(VaultFolder.name)
    private folderModel: Model<VaultFolderDocument>,
    @InjectModel(VaultFile.name)
    private fileModel: Model<VaultFileDocument>,
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(Milestone.name)
    private milestoneModel: Model<MilestoneDocument>,
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Thread.name)
    private threadModel: Model<ThreadDocument>,
    @InjectModel(ThreadMessage.name)
    private threadMessageModel: Model<ThreadMessageDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
  
    private readonly uploadsService: UploadsService,) {}

  private async recordProjectActivity(data: {
    userId: string;
    projectId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!data?.userId || !Types.ObjectId.isValid(data.userId)) return;
      if (!data?.projectId || !Types.ObjectId.isValid(data.projectId)) return;

      const now = new Date();
      const userObjectId = new Types.ObjectId(data.userId);
      const projectObjectId = new Types.ObjectId(data.projectId);

      const doc: any = {
        userId: userObjectId,
        actorId: userObjectId,
        projectId: projectObjectId,
        type: data.type,
        entityType: data.entityType || null,
        action: data.action || data.type,
        details: data.details || {},
        metadata: data.metadata || {},
        payload: data.payload || {},
        createdAt: now,
        updatedAt: now,
      };

      if (data.entityId) {
        if (Types.ObjectId.isValid(data.entityId)) {
          doc.entityId = new Types.ObjectId(data.entityId);
        }
        doc.entityKey = data.entityId;
      }

      const result = await this.fileModel.db.collection('activities').insertOne(doc);
      const savedActivity = { ...doc, _id: result.insertedId };

      this.eventEmitter.emit('activityCreated', savedActivity);
      this.eventEmitter.emit('activity:created', savedActivity);
      this.eventEmitter.emit('activity.created', savedActivity);
    } catch (err: any) {
      this.logger.warn(`Project activity logging failed (${data?.type}): ${err?.message || err}`);
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // STORAGE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async checkStorageQuota(projectId: string, incomingFileBytes: number): Promise<void> {
    const projId = new Types.ObjectId(projectId);
    
    // Aggregate total size of all files in this project
    const result = await this.fileModel.aggregate([
      { $match: { projectId: projId } },
      { $group: { _id: null, totalBytes: { $sum: '$sizeInBytes' } } }
    ]);

    const currentUsedBytes = result.length > 0 ? result[0].totalBytes : 0;

    if (currentUsedBytes + incomingFileBytes > PROJECT_STORAGE_LIMIT_BYTES) {
      // HTTP 402 Payment Required -> Triggers frontend upgrade modal
      throw new HttpException({
        message: 'Storage limit exceeded. Please upgrade your plan.',
        currentUsedBytes,
        limitBytes: PROJECT_STORAGE_LIMIT_BYTES
      }, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILE & FOLDER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async uploadFile(projectId: string, userId: string, file: Express.Multer.File, folderId?: string) {
    // 1. Verify Quota
    await this.checkStorageQuota(projectId, file.size);

    // 2. Persist file through the shared uploads pipeline.
    // In production this stores to Cloudflare R2 when R2 env vars are configured.
    // It falls back to local disk only when R2 is not configured.
    const stored = await this.uploadsService.uploadFile(file);

    const storedFilename =
      stored.name ||
      file.originalname ||
      file.filename ||
      'New File';

    const fileUrl = String(stored.url || '');
    const storedSize = Number(stored.size ?? file.size ?? 0);
    const storedMime = stored.mime || file.mimetype || 'application/octet-stream';

    if (!fileUrl) {
      throw new HttpException(
        { message: 'File upload failed: no file URL was returned.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3. Save Metadata
    const newFile = new this.fileModel({
      projectId: new Types.ObjectId(projectId),
      folderId: folderId ? new Types.ObjectId(folderId) : null,
      originalName: file.originalname,
      fileUrl,
      sizeInBytes: storedSize,
      mimeType: storedMime,
      uploadedBy: new Types.ObjectId(userId),
    });

    const saved = await newFile.save();

    await this.recordProjectActivity({
      userId,
      projectId,
      type: 'file_uploaded',
      entityType: 'file',
      entityId: saved._id?.toString?.(),
      action: 'uploaded',
      details: {
        fileName: file.originalname || storedFilename || 'New File',
        title: file.originalname || storedFilename || 'New File',
        mimeType: file.mimetype,
        sizeInBytes: file.size,
        folderId: folderId || null,
      },
      metadata: {
        source: 'files',
        fileId: saved._id?.toString?.(),
      },
      payload: {
        fileName: file.originalname || storedFilename || 'New File',
        fileId: saved._id?.toString?.(),
        folderId: folderId || null,
      },
    });

    // ⭐ DIRECT REALTIME NOTIFICATIONS & LIVE ROOM OVERRIDE
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      let notificationsService: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}
      try { notificationsService = this.moduleRef.get(NotificationsService, { strict: false }); } catch(e) {}

      const db = this.fileModel.db;
      const projectObjectId = new Types.ObjectId(projectId);
      const projectDoc = await db.collection('projects').findOne({ _id: projectObjectId });

      if (projectDoc) {
        const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];

        // Grab owner, ownerId, and all members to ensure no one is missed
        const allAssociatedIds: any[] = [
          projectDoc.ownerId,
          projectDoc.owner,
          ...rawMembers.map((m: any) => m?.userId || m?._id || m)
        ];

        const memberIdsToNotify: string[] = allAssociatedIds
          .filter(Boolean)
          .map(id => id.toString())
          .filter(id => id !== userId);

        const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
        const safeProjectName = typeof projectDoc.name === 'string' && projectDoc.name.trim() ? projectDoc.name.trim() : (projectDoc.title || 'Project');
        const safeFileName = file.originalname || 'New File';

        // 1. Notify official DB members through NotificationsService when possible.
        // This path persists the notification, emits realtime updates, and triggers email fan-out.
        for (const recipientId of uniqueMembers) {
          try {
            let createdViaNotificationsService = false;

            if (notificationsService?.create) {
              try {
                await notificationsService.notify({
                  userId: recipientId,
                  type: 'file_uploaded',
                  title: `📁 New File in ${safeProjectName}`,
                  body: safeFileName,
                  icon: '📁',
                  priority: 'high',
                  triggeredBy: userId,
                  data: {
                    projectId,
                    projectName: safeProjectName,
                    fileName: safeFileName,
                    extra: { fileId: saved._id.toString() },
                    emailFanoutEligible: true,
                    projectMemberNotification: true,
                  },
                  actions: [{ label: 'View Files', url: `/projects/${projectId}?tab=files` }],
                  groupKey: `project-file-${recipientId}-${projectId}-${saved._id.toString()}`,
                });

                createdViaNotificationsService = true;
              } catch (notificationErr) {
                this.logger.warn(
                  `NotificationsService file-upload notification failed for user ${recipientId}; falling back to direct insert: ${
                    (notificationErr as any)?.message || notificationErr
                  }`,
                );
              }
            }

            if (createdViaNotificationsService) continue;

            const notifResult = await db.collection('notifications').insertOne({
              userId: new Types.ObjectId(recipientId as string),
              type: 'file_uploaded',
              title: `📁 New File in ${safeProjectName}`,
              body: safeFileName,
              data: {
                projectId,
                projectName: safeProjectName,
                fileName: safeFileName,
                extra: { fileId: saved._id.toString() },
                emailFanoutEligible: true,
                projectMemberNotification: true,
              },
              channels: ['in_app'],
              priority: 'high',
              isRead: false,
              isClicked: false,
              isDismissed: false,
              groupCount: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });

            if (notifGateway && notifGateway.server) {
              notifGateway.server.to(recipientId as string).emit('new_notification', newNotif);
              notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }
            if (rtGateway && rtGateway.server) {
              rtGateway.server.to(recipientId as string).emit('new_notification', newNotif);
              rtGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
            }

            this.eventEmitter.emit('notification.created', newNotif);
          } catch (innerErr) {
            this.logger.error(`Failed to natively notify user ${recipientId}`, innerErr);
          }
        }

        // 2. LIVE ROOM OVERRIDE: Blast notification to anyone currently viewing the project board
        const liveRoomNotif = {
          _id: new Types.ObjectId(), // Ephemeral ID for the frontend to render
          type: 'file_uploaded',
          title: `📁 New File in ${safeProjectName}`,
          body: safeFileName,
          data: {
            projectId: projectId,
            projectName: safeProjectName,
            extra: { fileId: saved._id.toString() }
          },
          channels: ['in_app'],
          priority: 'normal',
          isRead: false,
          createdAt: new Date()
        };

        if (notifGateway && notifGateway.server) {
          notifGateway.server.to(`project:${projectId}`).emit('new_notification', liveRoomNotif);
          notifGateway.server.to(projectId).emit('new_notification', liveRoomNotif);
        }
        if (rtGateway && rtGateway.server) {
          rtGateway.server.to(`project:${projectId}`).emit('new_notification', liveRoomNotif);
          rtGateway.server.to(projectId).emit('new_notification', liveRoomNotif);
        }

        this.logger.log(`✅ File ${saved._id.toString()} natively notified ${uniqueMembers.length} DB recipient(s) AND broadcasted to Live Rooms`);
      }
    } catch (err) {
      this.logger.error('⚠️ Failed to process native file notifications:', err);
    }

    return saved;
  }

  async createFolder(projectId: string, userId: string, name: string, accessLevel: 'public' | 'private', allowedUserIds: string[] = []) {
    const folder = new this.folderModel({
      projectId: new Types.ObjectId(projectId),
      name,
      accessLevel,
      allowedUsers: allowedUserIds.map(id => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(userId)
    });
    const saved = await folder.save();

    await this.recordProjectActivity({
      userId,
      projectId,
      type: 'folder_created',
      entityType: 'folder',
      entityId: saved._id?.toString?.(),
      action: 'created',
      details: {
        folderName: name,
        title: name,
        accessLevel,
      },
      metadata: {
        source: 'files',
        folderId: saved._id?.toString?.(),
      },
      payload: {
        folderName: name,
        folderId: saved._id?.toString?.(),
      },
    });

    return saved;
  }

  private async getProjectFileBacklinks(
    projectId: Types.ObjectId,
    fileIds: string[],
  ): Promise<Map<string, VaultBacklinkCounts>> {
    const backlinks = new Map<
      string,
      VaultBacklinkCounts
    >(
      fileIds.map((fileId) => [
        fileId,
        createEmptyVaultBacklinks(),
      ]),
    );

    if (fileIds.length === 0) {
      return backlinks;
    }

    const [
      moves,
      milestones,
      announcements,
      threads,
    ] = await Promise.all([
      this.taskModel
        .find({
          projectId,
          'attachments.fileId': {
            $in: fileIds,
          },
        })
        .select({
          _id: 1,
          attachments: 1,
        })
        .lean()
        .exec(),
      this.milestoneModel
        .find({
          projectId,
          'fileReferences.fileId': {
            $in: fileIds,
          },
        })
        .select({
          _id: 1,
          fileReferences: 1,
        })
        .lean()
        .exec(),
      this.announcementModel
        .find({
          projectId,
          'fileReferences.fileId': {
            $in: fileIds,
          },
        })
        .select({
          _id: 1,
          fileReferences: 1,
        })
        .lean()
        .exec(),
      this.threadModel
        .find({
          projectId,
        })
        .select({
          _id: 1,
        })
        .lean()
        .exec(),
    ]);

    const threadIds = threads
      .map((thread: any) => thread?._id)
      .filter(Boolean);

    const teamRoomMessages =
      threadIds.length > 0
        ? await this.threadMessageModel
            .find({
              threadId: {
                $in: threadIds,
              },
              'fileReferences.fileId': {
                $in: fileIds,
              },
            })
            .select({
              _id: 1,
              fileReferences: 1,
            })
            .lean()
            .exec()
        : [];

    const countDocumentReferences = (
      documents: any[],
      fieldName: string,
      countKey:
        | 'moves'
        | 'milestones'
        | 'announcements'
        | 'teamRoomMessages',
    ) => {
      for (const document of documents) {
        const references = Array.isArray(
          document?.[fieldName],
        )
          ? document[fieldName]
          : [];

        const documentFileIds = new Set(
          references
            .map((reference: any) =>
              String(
                reference?.fileId || '',
              ).trim(),
            )
            .filter((fileId: string) =>
              backlinks.has(fileId),
            ),
        );

        for (const fileId of documentFileIds) {
          const current =
            backlinks.get(fileId);

          if (current) {
            current[countKey] += 1;
          }
        }
      }
    };

    countDocumentReferences(
      moves,
      'attachments',
      'moves',
    );

    countDocumentReferences(
      milestones,
      'fileReferences',
      'milestones',
    );

    countDocumentReferences(
      announcements,
      'fileReferences',
      'announcements',
    );

    countDocumentReferences(
      teamRoomMessages,
      'fileReferences',
      'teamRoomMessages',
    );

    for (const counts of backlinks.values()) {
      counts.total =
        counts.moves +
        counts.milestones +
        counts.announcements +
        counts.teamRoomMessages;
    }

    return backlinks;
  }

  async getProjectVault(projectId: string, userId: string) {
    const projId = new Types.ObjectId(projectId);
    const userObjId = new Types.ObjectId(userId);

    // Find all folders, but filter private ones if user isn't allowed
    const allFolders = await this.folderModel.find({ projectId: projId }).exec();
    
    const accessibleFolders = allFolders.filter(folder => {
      if (folder.accessLevel === 'public') return true;
      if (folder.createdBy.equals(userObjId)) return true;
      // Note: Add logic here later to allow Project Moderators to see everything
      return folder.allowedUsers.some(u => u.equals(userObjId));
    });

    // Find all files in the project
    const allFiles = await this.fileModel
      .find({ projectId: projId })
      .populate('uploadedBy', 'firstName lastName avatar')
      .exec();

    // Filter files to only show those in accessible folders (or root)
    const accessibleFolderIds = accessibleFolders.map(f => f._id.toString());
    const accessibleFiles = allFiles.filter(file => {
      if (!file.folderId) return true; // It's in the root
      return accessibleFolderIds.includes(file.folderId.toString());
    });

    const accessibleFileIds = accessibleFiles
      .map((file: any) =>
        this.normalizeId(file?._id),
      )
      .filter(Boolean);

    const backlinks =
      await this.getProjectFileBacklinks(
        projId,
        accessibleFileIds,
      );

    const filesWithBacklinks =
      accessibleFiles.map((file: any) => {
        const fileObject =
          typeof file?.toObject === 'function'
            ? file.toObject()
            : file;

        const fileId =
          this.normalizeId(
            fileObject?._id,
          );

        return {
          ...fileObject,
          backlinks:
            backlinks.get(fileId) ||
            createEmptyVaultBacklinks(),
        };
      });

    // Get current usage stats for the UI progress bar
    const result = await this.fileModel.aggregate([
      { $match: { projectId: projId } },
      { $group: { _id: null, totalBytes: { $sum: '$sizeInBytes' } } }
    ]);
    const storageUsedBytes = result.length > 0 ? result[0].totalBytes : 0;

    return {
      folders: accessibleFolders,
      files: filesWithBacklinks,
      storage: {
        usedBytes: storageUsedBytes,
        limitBytes: PROJECT_STORAGE_LIMIT_BYTES
      }
    };
  }
  private toObjectId(value: string, label: string): Types.ObjectId {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new NotFoundException(`${label} not found`);
    }

    return new Types.ObjectId(value);
  }

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();
    if (value?._id) return this.normalizeId(value._id);
    if (value?.userId) return this.normalizeId(value.userId);
    return value.toString?.() || '';
  }

  private async findVaultFileOrThrow(fileId: string): Promise<VaultFileDocument> {
    const fileObjectId = this.toObjectId(fileId, 'File');

    const file = await this.fileModel.findById(fileObjectId).exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async findAccessibleFileForProject(
    fileId: string,
    projectId: string,
    userId: string,
  ): Promise<VaultFileDocument> {
    const file =
      await this.findVaultFileOrThrow(
        fileId,
      );

    const expectedProjectId =
      this.toObjectId(
        projectId,
        'Project',
      ).toString();

    const fileProjectId =
      this.normalizeId(
        (file as any).projectId,
      );

    if (
      !fileProjectId ||
      fileProjectId !== expectedProjectId
    ) {
      throw new ForbiddenException(
        'This File does not belong to the project',
      );
    }

    const folderId =
      this.normalizeId(
        (file as any).folderId,
      );

    if (!folderId) {
      return file;
    }

    const folderObjectId =
      this.toObjectId(
        folderId,
        'Folder',
      );

    const folder =
      await this.folderModel
        .findOne({
          _id: folderObjectId,
          projectId:
            new Types.ObjectId(
              expectedProjectId,
            ),
        })
        .exec();

    if (!folder) {
      throw new ForbiddenException(
        'You do not have access to this File',
      );
    }

    const userObjectId =
      this.toObjectId(
        userId,
        'User',
      );

    const folderIsVisible =
      folder.accessLevel === 'public' ||
      folder.createdBy.equals(
        userObjectId,
      ) ||
      folder.allowedUsers.some(
        (allowedUserId) =>
          allowedUserId.equals(
            userObjectId,
          ),
      );

    if (!folderIsVisible) {
      throw new ForbiddenException(
        'You do not have access to this File',
      );
    }

    return file;
  }

  private async assertCanManageFile(file: VaultFileDocument, userId: string): Promise<void> {
    const userObjectId = this.toObjectId(userId, 'User');
    const userIdString = userObjectId.toString();

    const uploadedById = this.normalizeId((file as any).uploadedBy);

    if (uploadedById === userIdString) {
      return;
    }

    const projectId = this.normalizeId((file as any).projectId);

    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new ForbiddenException('You do not have permission to manage this file');
    }

    const projectDoc = await this.fileModel.db
      .collection('projects')
      .findOne({ _id: new Types.ObjectId(projectId) });

    if (!projectDoc) {
      throw new ForbiddenException('You do not have permission to manage this file');
    }

    const ownerId = this.normalizeId(projectDoc.ownerId || projectDoc.owner);

    if (ownerId === userIdString) {
      return;
    }

    const members = Array.isArray(projectDoc.members) ? projectDoc.members : [];
    const manageableRoles = new Set(['owner', 'admin', 'moderator', 'manager']);

    const matchingMember = members.find((member: any) => {
      const memberUserId = this.normalizeId(
        member?.userId ||
        member?.user ||
        member?._id ||
        member?.id
      );

      return memberUserId === userIdString;
    });

    const role = String(matchingMember?.role || '').toLowerCase();

    if (manageableRoles.has(role)) {
      return;
    }

    throw new ForbiddenException('You do not have permission to manage this file');
  }

  private validateVaultFileName(originalName: string): string {
    const cleaned = String(originalName || '').trim();

    if (!cleaned) {
      throw new HttpException(
        { message: 'File name is required' },
        HttpStatus.BAD_REQUEST
      );
    }

    if (cleaned.length > 180) {
      throw new HttpException(
        { message: 'File name is too long' },
        HttpStatus.BAD_REQUEST
      );
    }

    if (cleaned.includes('/') || cleaned.includes('\\\\') || cleaned.includes('\\0')) {
      throw new HttpException(
        { message: 'File name cannot contain path characters' },
        HttpStatus.BAD_REQUEST
      );
    }

    return cleaned;
  }

  private async removeLocalUploadIfSafe(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return;
    }

    const fileName = path.basename(fileUrl);

    if (!fileName || fileName === '.' || fileName === '..') {
      return;
    }

    const absolutePath = path.resolve(process.cwd(), 'uploads', fileName);

    try {
      await fs.unlink(absolutePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        this.logger.warn(`Could not remove local vault upload ${absolutePath}: ${err?.message || err}`);
      }
    }
  }

  async renameFile(fileId: string, userId: string, originalName: string): Promise<VaultFileDocument> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    file.originalName = this.validateVaultFileName(originalName);

    const saved = await file.save();

    this.eventEmitter.emit('vault.file.renamed', {
      fileId: this.normalizeId((saved as any)._id),
      projectId: this.normalizeId((saved as any).projectId),
      userId,
      originalName: saved.originalName,
    });

    return saved;
  }

  async moveFile(fileId: string, userId: string, folderId?: string | null): Promise<VaultFileDocument> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    if (folderId) {
      const folderObjectId = this.toObjectId(folderId, 'Folder');
      const targetFolder = await this.folderModel.findById(folderObjectId).exec();

      if (!targetFolder) {
        throw new NotFoundException('Destination folder not found');
      }

      const fileProjectId = this.normalizeId((file as any).projectId);
      const folderProjectId = this.normalizeId((targetFolder as any).projectId);

      if (fileProjectId !== folderProjectId) {
        throw new ForbiddenException('Cannot move file into a folder from another project');
      }

      file.folderId = folderObjectId;
    } else {
      file.folderId = null as any;
    }

    const saved = await file.save();

    this.eventEmitter.emit('vault.file.moved', {
      fileId: this.normalizeId((saved as any)._id),
      projectId: this.normalizeId((saved as any).projectId),
      userId,
      folderId: saved.folderId ? this.normalizeId(saved.folderId) : null,
    });

    return saved;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    const fileUrl = String((file as any).fileUrl || '');
    const projectId = this.normalizeId((file as any).projectId);
    const originalName = String((file as any).originalName || 'File');

    await this.fileModel.deleteOne({ _id: (file as any)._id }).exec();
    await this.removeLocalUploadIfSafe(fileUrl);

    this.eventEmitter.emit('vault.file.deleted', {
      fileId,
      projectId,
      userId,
      originalName,
    });

    this.logger.log(`Vault file deleted: ${fileId}`);
  }

}

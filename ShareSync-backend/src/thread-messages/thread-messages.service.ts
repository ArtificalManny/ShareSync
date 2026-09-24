import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { VaultService } from '../vault/vault.service';
import { CreateThreadMessageDto } from './dto/create-thread-message.dto';
import {
  MessageAttachmentReceiptPayload,
  verifyMessageAttachmentReceipt,
} from '../uploads/message-attachment-receipt';

export interface GetThreadMessagesOptions {
  limit?: number;
  before?: string;
}

const USER_POPULATE_FIELDS = 'firstName lastName username email profilePicture avatar avatarUrl';

@Injectable()
export class ThreadMessagesService {
  private readonly logger = new Logger(ThreadMessagesService.name);

  constructor(
    @InjectModel(ThreadMessage.name) private readonly messageModel: Model<ThreadMessageDocument>,
    private readonly vaultService: VaultService,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
  ) {}

  // team-room-secure-message-pipeline-v1
  private normalizeProjectUserId(
    value: any,
  ): string {
    if (!value) {
      return '';
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(
        value,
      ).trim();
    }

    if (
      value instanceof
      Types.ObjectId
    ) {
      return value.toString();
    }

    return this.normalizeProjectUserId(
      value?.userId ||
        value?.user ||
        value?.memberId ||
        value?.member ||
        value?._id ||
        value?.id,
    );
  }

  private async requireThreadAccess(
    threadId: string,
    userId: string,
  ): Promise<void> {
    if (
      !threadId ||
      !Types.ObjectId.isValid(
        threadId,
      )
    ) {
      throw new NotFoundException(
        'Thread not found',
      );
    }

    if (
      !userId ||
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'User ID is invalid',
      );
    }

    const db =
      this.messageModel.db;

    const threadDoc: any =
      await db
        .collection(
          'threads',
        )
        .findOne({
          _id:
            new Types.ObjectId(
              threadId,
            ),
        });

    if (!threadDoc) {
      throw new NotFoundException(
        'Thread not found',
      );
    }

    const projectId =
      String(
        threadDoc.projectId ||
          '',
      );

    if (
      !projectId ||
      !Types.ObjectId.isValid(
        projectId,
      )
    ) {
      throw new BadRequestException(
        'Thread project is invalid',
      );
    }

    const project: any =
      await db
        .collection(
          'projects',
        )
        .findOne({
          _id:
            new Types.ObjectId(
              projectId,
            ),
        });

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const allowedUserIds =
      new Set<string>();

    [
      project.ownerId,
      project.owner,
      project.createdBy,
      project.createdById,
    ].forEach(
      (candidate) => {
        const id =
          this.normalizeProjectUserId(
            candidate,
          );

        if (id) {
          allowedUserIds.add(
            id,
          );
        }
      },
    );

    [
      project.members,
      project.sharedWith,
      project.participantIds,
    ].forEach(
      (collection) => {
        if (
          !Array.isArray(
            collection,
          )
        ) {
          return;
        }

        collection.forEach(
          (candidate: any) => {
            const id =
              this.normalizeProjectUserId(
                candidate,
              );

            if (id) {
              allowedUserIds.add(
                id,
              );
            }
          },
        );
      },
    );

    if (
      !allowedUserIds.has(
        userId,
      )
    ) {
      throw new ForbiddenException(
        'You do not have access to this project',
      );
    }
  }

  private verifyThreadMessageAttachments(
    userId: string,
    attachments:
      CreateThreadMessageDto[
        'attachments'
      ],
  ): Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
    thumbnailUrl?: string;
  }> {
    if (
      !Array.isArray(
        attachments,
      ) ||
      attachments.length === 0
    ) {
      return [];
    }

    if (
      attachments.length > 5
    ) {
      throw new BadRequestException(
        'A Team Room message can contain at most 5 attachments.',
      );
    }

    const normalizedUserId =
      String(
        userId ||
          '',
      ).trim();

    return attachments.map(
      (
        attachment,
        index,
      ) => {
        const payload:
          MessageAttachmentReceiptPayload =
        {
          version: 1,

          /*
           * Bind the receipt to the authenticated sender.
           * uploaderId is never trusted from the client.
           */
          uploaderId:
            normalizedUserId,

          fileId:
            String(
              attachment.fileId ||
                '',
            ).trim(),

          fileName:
            String(
              attachment.fileName ||
                '',
            ).trim(),

          fileUrl:
            String(
              attachment.fileUrl ||
                '',
            ).trim(),

          mimeType:
            String(
              attachment.mimeType ||
                '',
            ).trim(),

          fileSize:
            Number(
              attachment.fileSize,
            ),

          thumbnailUrl:
            attachment.thumbnailUrl
              ? String(
                  attachment.thumbnailUrl,
                ).trim()
              : undefined,

          expiresAt:
            Number(
              attachment
                .receiptExpiresAt,
            ),
        };

        if (
          !payload.fileId ||
          !payload.fileName ||
          !payload.fileUrl ||
          !payload.mimeType
        ) {
          throw new BadRequestException(
            `Attachment ${
              index + 1
            } is missing required information.`,
          );
        }

        if (
          !Number.isFinite(
            payload.fileSize,
          ) ||
          Number(
            payload.fileSize,
          ) < 0
        ) {
          throw new BadRequestException(
            `Attachment ${
              index + 1
            } has an invalid file size.`,
          );
        }

        /*
         * Team Room uses the proven Messages upload boundary.
         * It remains image-only until documents have their own
         * content-moderation pipeline.
         */
        if (
          !payload.mimeType
            .toLowerCase()
            .startsWith(
              'image/',
            )
        ) {
          throw new BadRequestException(
            'Team Room currently supports image attachments only.',
          );
        }

        const receiptIsValid =
          verifyMessageAttachmentReceipt(
            payload,
            attachment.receipt,
          );

        if (
          !receiptIsValid
        ) {
          throw new BadRequestException(
            'This attachment authorization is invalid or expired.',
          );
        }

        /*
         * Receipt material is deliberately discarded.
         * Only clean display metadata reaches Mongo.
         */
        return {
          fileId:
            payload.fileId,

          fileName:
            payload.fileName,

          fileUrl:
            payload.fileUrl,

          mimeType:
            payload.mimeType,

          fileSize:
            payload.fileSize,

          thumbnailUrl:
            payload.thumbnailUrl,
        };
      },
    );
  }

  private async normalizeFileReferences(
    projectId: string,
    userId: string,
    references:
      | Array<
          string | { fileId?: string }
        >
      | undefined,
  ): Promise<
    Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      source: 'project_file';
      linkedBy: Types.ObjectId;
      linkedAt: Date;
    }>
  > {
    if (!Array.isArray(references)) {
      return [];
    }

    const fileIds = Array.from(
      new Set(
        references
          .map((reference) =>
            String(
              typeof reference === 'string'
                ? reference
                : reference?.fileId || '',
            ).trim(),
          )
          .filter(Boolean),
      ),
    );

    if (fileIds.length > 1) {
      throw new BadRequestException(
        'A Team Room message can reference one project File',
      );
    }

    const linkedBy =
      new Types.ObjectId(userId);

    return Promise.all(
      fileIds.map(async (fileId) => {
        if (!Types.ObjectId.isValid(fileId)) {
          throw new BadRequestException(
            'Project File ID is invalid',
          );
        }

        const file =
          await this.vaultService
            .findAccessibleFileForProject(
              fileId,
              projectId,
              userId,
            );

        const fileName = String(
          file.originalName ||
          'Project file',
        ).trim();

        const fileUrl = String(
          file.fileUrl || '',
        ).trim();

        const fileType = String(
          file.mimeType || '',
        ).trim();

        const rawSize = Number(
          file.sizeInBytes ?? 0,
        );

        const fileSize =
          Number.isFinite(rawSize) &&
          rawSize >= 0
            ? rawSize
            : 0;

        if (!fileName || !fileUrl) {
          throw new BadRequestException(
            'This project File is missing required file information',
          );
        }

        return {
          fileId,
          fileName,
          fileUrl,
          fileType,
          fileSize,
          source:
            'project_file' as const,
          linkedBy,
          linkedAt: new Date(),
        };
      }),
    );
  }

  async create(threadId: string, userId: string, dto: CreateThreadMessageDto): Promise<ThreadMessageDocument> {
    await this.requireThreadAccess(
      threadId,
      userId,
    );

    if (
      !threadId ||
      !Types.ObjectId.isValid(threadId)
    ) {
      throw new NotFoundException(
        'Thread not found',
      );
    }

    if (
      !userId ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestException(
        'User ID is invalid',
      );
    }

    const threadObjectId =
      new Types.ObjectId(threadId);

    const userObjectId =
      new Types.ObjectId(userId);

    const db = this.messageModel.db;

    const threadDoc: any =
      await db
        .collection('threads')
        .findOne({
          _id: threadObjectId,
        });

    if (!threadDoc) {
      throw new NotFoundException(
        'Thread not found',
      );
    }

    if (
      threadDoc.isLocked ===
      true
    ) {
      throw new ForbiddenException(
        'This thread is locked and cannot accept new messages',
      );
    }

    const projectId = String(
      threadDoc.projectId || '',
    );

    if (
      !projectId ||
      !Types.ObjectId.isValid(projectId)
    ) {
      throw new BadRequestException(
        'Thread project is invalid',
      );
    }

    const content = String(
      dto.content || '',
    ).trim();

    if (!content) {
      throw new BadRequestException(
        'Message content is required',
      );
    }

    const verifiedAttachments =
      this.verifyThreadMessageAttachments(
        userId,
        dto.attachments,
      );

    const fileReferences =
      await this.normalizeFileReferences(
        projectId,
        userId,
        dto.fileReferences,
      );

    const message = new this.messageModel({
      threadId: threadObjectId,
      userId: userObjectId,
      content,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      reactions: [],
      attachments:
        verifiedAttachments,
      fileReferences,
      isEdited: false,
    });

    const saved = await message.save();

    // ⭐ DIRECT REALTIME NOTIFICATIONS & LIVE ROOM OVERRIDE
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}

      if (threadDoc) {
        const projectId = threadDoc.projectId;
        const projectDoc = await db.collection('projects').findOne({ _id: projectId });
        
        if (projectDoc) {
          const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
          const allAssociatedIds: any[] = [
            projectDoc.ownerId,
            projectDoc.owner,
            ...rawMembers.map((m: any) => m?.userId || m?._id || m)
          ];

          const mutedUserIds =
            new Set(
              (
                Array.isArray(
                  threadDoc.mutedBy,
                )
                  ? threadDoc.mutedBy
                  : []
              )
                .map(
                  (id: any) =>
                    String(
                      id || '',
                    ),
                )
                .filter(Boolean),
            );

          const memberIdsToNotify: string[] = allAssociatedIds
            .filter(Boolean)
            .map(id => id.toString())
            .filter(
              id =>
                id !== userId &&
                !mutedUserIds.has(
                  id,
                ),
            );

          const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
          const safeProjectName = projectDoc.name || projectDoc.title || 'Project';

          // 1. Save through NotificationsService so in-app + email fan-out both run
          let notificationsService: NotificationsService | null = null;
          try {
            notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
          } catch (e) {}

          for (const recipientId of uniqueMembers) {
            try {
              if (notificationsService?.create) {
                await notificationsService.create({
                  userId: recipientId,
                  type: 'thread_message' as any,
                  title: `💬 New message in ${threadDoc.title}`,
                  body: dto.content,
                  data: {
                    projectId: projectId.toString(),
                    projectName: safeProjectName,
                    emailFanoutEligible: true,
                    teamRoomNotification: true,
                    extra: { threadId },
                  } as any,
                  actions: [
                    {
                      label: 'View Team Room',
                      url: `/projects/${projectId.toString()}?tab=team-room`,
                    },
                  ],
                  channels: ['in_app'] as any,
                  priority: 'high' as any,
                } as any);
                continue;
              }

              // Fallback keeps the old in-app behavior if NotificationsService is unavailable.
              const notifResult = await db.collection('notifications').insertOne({
                userId: new Types.ObjectId(recipientId),
                type: 'thread_message',
                title: `�� New message in ${threadDoc.title}`,
                body: dto.content,
                data: {
                  projectId: projectId.toString(),
                  projectName: safeProjectName,
                  emailFanoutEligible: true,
                  teamRoomNotification: true,
                  extra: { threadId },
                },
                channels: ['in_app'],
                priority: 'high',
                isRead: false,
                isClicked: false,
                isDismissed: false,
                groupCount: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });
              if (notifGateway?.server) {
                notifGateway.server.to(recipientId).emit('new_notification', newNotif);
                notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
              }
            } catch (e) {
              this.logger.warn(`Thread message notification failed for ${recipientId}: ${e?.message || e}`);
            }
          }

          // 2. Live Room Override
          if (notifGateway?.server) {
            notifGateway.server.to(`project:${projectId}`).emit('new_thread_message', saved);
            notifGateway.server.to(`thread:${threadId}`).emit('new_thread_message', saved);
          }
        }
      }
    } catch (err) {
      this.logger.error('Failed thread message broadcast', err);
    }

    return saved;
  }

  async findById(messageId: string): Promise<ThreadMessageDocument> {
    const msg = await this.messageModel.findById(messageId);
    if (!msg) throw new NotFoundException(`ThreadMessage with ID ${messageId} not found`);
    return msg;
  }

  async findByThread(
    threadId: string,
    userId: string,
    options: GetThreadMessagesOptions = {},
  ): Promise<ThreadMessageDocument[]> {
    await this.requireThreadAccess(
      threadId,
      userId,
    );

    const limit =
      options.limit ??
      50;

    const query: any = {
      threadId:
        new Types.ObjectId(
          threadId,
        ),
    };

    if (
      options.before
    ) {
      query.createdAt = {
        $lt:
          new Date(
            options.before,
          ),
      };
    }

    return this.messageModel
      .find(
        query,
      )
      .populate(
        'userId',
        USER_POPULATE_FIELDS,
      )
      .sort({
        createdAt: -1,
      })
      .limit(
        limit,
      )
      .exec();
  }

  async edit(messageId: string, userId: string, content: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);

    await this.requireThreadAccess(
      msg.threadId.toString(),
      userId,
    );

    if (!msg.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only edit your own messages');
    msg.content = content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    return msg.save();
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const msg = await this.findById(messageId);

    await this.requireThreadAccess(
      msg.threadId.toString(),
      userId,
    );

    if (!msg.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only delete your own messages');
    await this.messageModel.deleteOne({ _id: msg._id });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);

    await this.requireThreadAccess(
      msg.threadId.toString(),
      userId,
    );

    const userObjectId = new Types.ObjectId(userId);
    const existing = msg.reactions.find((r: any) => r.emoji === emoji);
    if (existing) {
      if (!existing.users.some((u: Types.ObjectId) => u.equals(userObjectId))) existing.users.push(userObjectId);
    } else {
      msg.reactions.push({ emoji, users: [userObjectId] } as any);
    }
    return msg.save();
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);

    await this.requireThreadAccess(
      msg.threadId.toString(),
      userId,
    );

    const userObjectId = new Types.ObjectId(userId);
    const reaction = msg.reactions.find((r: any) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((u: Types.ObjectId) => !u.equals(userObjectId));
      if (reaction.users.length === 0) msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
    }
    return msg.save();
  }
}

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
import { ProjectsService } from '../projects/projects.service';
import {
  TeamRoomPendingUpload,
} from '../uploads/schemas/team-room-pending-upload.schema';
import {
  TeamRoomUploadCleanupService,
} from '../uploads/team-room-upload-cleanup.service';
import { CreateThreadMessageDto } from './dto/create-thread-message.dto';
import {
  ThreadMessageAttachmentReceiptPayload,
  verifyThreadMessageAttachmentReceipt,
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
    private readonly projectsService: ProjectsService,

    // openshare-team-room-asset-consumption-v1
    @InjectModel(
      TeamRoomPendingUpload.name,
    )
    private readonly teamRoomPendingUploadModel:
      Model<any>,

    // openshare-team-room-message-delete-cleanup-v1
    private readonly teamRoomUploadCleanupService:
      TeamRoomUploadCleanupService,
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
    options: {
      skipMemberBilling?: boolean;
    } = {},
  ): Promise<string> {
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

    // openshare-thread-message-member-access-enforcement-v1
    //
    // Raw project authorization succeeds first. Billing then determines
    // whether this preserved workspace member is currently active.
    if (
      !options.skipMemberBilling
    ) {
      await this.projectsService
        .assertProjectMemberActiveForBilling(
          projectId,
          userId,
        );
    }

    return projectId;
  }

  private verifyThreadMessageAttachments(
    userId: string,
    threadId: string,
    projectId: string,
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
          ThreadMessageAttachmentReceiptPayload =
        {
          version: 2,

          threadId:
            String(
              threadId || '',
            ).trim(),

          projectId:
            String(
              projectId || '',
            ).trim(),

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
          !payload.threadId ||
          !payload.projectId ||
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
          verifyThreadMessageAttachmentReceipt(
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

  private async releaseThreadMessageAttachmentClaims(
    messageId: Types.ObjectId,
    claimedAssetIds:
      Types.ObjectId[],
  ): Promise<void> {
    if (
      !Array.isArray(
        claimedAssetIds,
      ) ||
      claimedAssetIds.length === 0
    ) {
      return;
    }

    await this
      .teamRoomPendingUploadModel
      .updateMany(
        {
          _id: {
            $in:
              claimedAssetIds,
          },

          consumedMessageId:
            messageId,

          consumedAt:
            null,
        },
        {
          $set: {
            consumedMessageId:
              null,
          },
        },
      )
      .exec();
  }

  private async claimThreadMessageAttachments(
    messageId: Types.ObjectId,
    userId: string,
    threadId: string,
    projectId: string,
    attachments: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      mimeType?: string;
      fileSize?: number;
      thumbnailUrl?: string;
    }>,
  ): Promise<Types.ObjectId[]> {
    if (
      !Array.isArray(
        attachments,
      ) ||
      attachments.length === 0
    ) {
      return [];
    }

    const normalizedUserId =
      String(
        userId || '',
      ).trim();

    const normalizedThreadId =
      String(
        threadId || '',
      ).trim();

    const normalizedProjectId =
      String(
        projectId || '',
      ).trim();

    if (
      !Types.ObjectId.isValid(
        normalizedUserId,
      ) ||
      !Types.ObjectId.isValid(
        normalizedThreadId,
      ) ||
      !Types.ObjectId.isValid(
        normalizedProjectId,
      )
    ) {
      throw new BadRequestException(
        'Attachment context is invalid',
      );
    }

    const fileIds =
      attachments.map(
        (attachment) =>
          String(
            attachment.fileId ||
            '',
          ).trim(),
      );

    if (
      new Set(
        fileIds,
      ).size !==
      fileIds.length
    ) {
      throw new BadRequestException(
        'A Team Room attachment cannot be used more than once in the same message.',
      );
    }

    const userObjectId =
      new Types.ObjectId(
        normalizedUserId,
      );

    const threadObjectId =
      new Types.ObjectId(
        normalizedThreadId,
      );

    const projectObjectId =
      new Types.ObjectId(
        normalizedProjectId,
      );

    const claimedAssetIds:
      Types.ObjectId[] =
      [];

    try {
      for (
        let index = 0;
        index < attachments.length;
        index += 1
      ) {
        const attachment =
          attachments[index];

        const fileId =
          String(
            attachment.fileId ||
            '',
          ).trim();

        /*
         * Atomic claim:
         * - exact file
         * - exact project
         * - exact thread
         * - exact uploader
         * - still unconsumed
         * - registry authorization still live
         */
        const asset: any =
          await this
            .teamRoomPendingUploadModel
            .findOneAndUpdate(
              {
                fileId,

                projectId:
                  projectObjectId,

                threadId:
                  threadObjectId,

                uploaderId:
                  userObjectId,

                consumedMessageId:
                  null,

                consumedAt:
                  null,

                expiresAt: {
                  $gt:
                    new Date(),
                },
              },
              {
                $set: {
                  consumedMessageId:
                    messageId,
                },
              },
              {
                new: true,
              },
            )
            .lean()
            .exec();

        if (!asset) {
          throw new BadRequestException(
            `Attachment ${
              index + 1
            } is expired, already used, or no longer available.`,
          );
        }

        claimedAssetIds.push(
          new Types.ObjectId(
            String(
              asset._id,
            ),
          ),
        );

        /*
         * Receipt verification already authenticates these values.
         * The registry independently confirms them as a server-side source
         * of truth before message persistence.
         */
        const assetFileName =
          String(
            asset.fileName ||
            '',
          );

        const assetFileUrl =
          String(
            asset.fileUrl ||
            '',
          );

        const assetMime =
          String(
            asset.mimeType ||
            '',
          );

        const assetSize =
          Math.max(
            0,
            Number(
              asset.sizeInBytes ||
              0,
            ),
          );

        const assetThumbnail =
          String(
            asset.thumbnailUrl ||
            '',
          );

        const attachmentFileName =
          String(
            attachment.fileName ||
            '',
          );

        const attachmentFileUrl =
          String(
            attachment.fileUrl ||
            '',
          );

        const attachmentMime =
          String(
            attachment.mimeType ||
            '',
          );

        const attachmentSize =
          Math.max(
            0,
            Number(
              attachment.fileSize ||
              0,
            ),
          );

        const attachmentThumbnail =
          String(
            attachment.thumbnailUrl ||
            '',
          );

        if (
          assetFileName !==
            attachmentFileName ||
          assetFileUrl !==
            attachmentFileUrl ||
          assetMime !==
            attachmentMime ||
          assetSize !==
            attachmentSize ||
          assetThumbnail !==
            attachmentThumbnail
        ) {
          throw new BadRequestException(
            `Attachment ${
              index + 1
            } does not match the stored upload asset.`,
          );
        }
      }

      return claimedAssetIds;
    } catch (error) {
      try {
        await this
          .releaseThreadMessageAttachmentClaims(
            messageId,
            claimedAssetIds,
          );
      } catch (
        releaseError
      ) {
        this.logger.error(
          'Failed to release Team Room attachment claims after claim failure',
          releaseError as any,
        );
      }

      throw error;
    }
  }

  private async finalizeThreadMessageAttachmentClaims(
    messageId: Types.ObjectId,
    claimedAssetIds:
      Types.ObjectId[],
  ): Promise<void> {
    if (
      !Array.isArray(
        claimedAssetIds,
      ) ||
      claimedAssetIds.length === 0
    ) {
      return;
    }

    await this
      .teamRoomPendingUploadModel
      .updateMany(
        {
          _id: {
            $in:
              claimedAssetIds,
          },

          consumedMessageId:
            messageId,

          consumedAt:
            null,
        },
        {
          $set: {
            consumedAt:
              new Date(),
          },
        },
      )
      .exec();
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

    // openshare-thread-message-billing-enforcement-v1
    await this.projectsService
      .assertProjectWritableForBilling(
        projectId,
      );

    const content = String(
      dto.content || '',
    ).trim();

    // team-room-image-attachments-v1-r1
    const verifiedAttachments =
      this.verifyThreadMessageAttachments(
        userId,
        threadId,
        projectId,
        dto.attachments,
      );

    const fileReferences =
      await this.normalizeFileReferences(
        projectId,
        userId,
        dto.fileReferences,
      );

    if (
      !content &&
      verifiedAttachments.length === 0 &&
      fileReferences.length === 0
    ) {
      throw new BadRequestException(
        'Message content or an attachment is required',
      );
    }

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

    // openshare-team-room-asset-consumption-v1
    //
    // Mongoose assigns _id before save, so it can serve as the one-time
    // claim token for every attachment in this message.
    const messageObjectId =
      new Types.ObjectId(
        String(
          (message as any)._id,
        ),
      );

    const claimedAttachmentIds =
      await this
        .claimThreadMessageAttachments(
          messageObjectId,
          userId,
          threadId,
          projectId,
          verifiedAttachments,
        );

    let saved:
      ThreadMessageDocument;

    try {
      saved =
        await message.save();
    } catch (error) {
      /*
       * Message persistence failed. Release only this message's claims so the
       * same still-valid uploads can be retried.
       *
       * No physical object is deleted here.
       */
      try {
        await this
          .releaseThreadMessageAttachmentClaims(
            messageObjectId,
            claimedAttachmentIds,
          );
      } catch (
        releaseError
      ) {
        this.logger.error(
          'Failed to release Team Room attachment claims after message save failure',
          releaseError as any,
        );
      }

      throw error;
    }

    /*
     * Message persistence succeeded. consumedMessageId already protects
     * against replay; consumedAt completes the durable lifecycle state.
     *
     * If this timestamp update fails, retain the successful message rather
     * than deleting user data. Later reconciliation can repair consumedAt.
     */
    try {
      await this
        .finalizeThreadMessageAttachmentClaims(
          messageObjectId,
          claimedAttachmentIds,
        );
    } catch (
      finalizeError
    ) {
      this.logger.error(
        'Failed to finalize Team Room attachment consumption',
        finalizeError as any,
      );
    }

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

    const projectId =
      await this.requireThreadAccess(
        msg.threadId.toString(),
        userId,
      );

    if (!msg.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException('You can only edit your own messages');

    await this.projectsService
      .assertProjectWritableForBilling(
        projectId,
      );

    msg.content = content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    return msg.save();
  }

  private async stageThreadMessageAttachmentDeletion(
    msg: ThreadMessageDocument,
    projectId: string,
  ): Promise<void> {
    const attachments =
      Array.isArray(
        (msg as any)
          ?.attachments,
      )
        ? (
            (msg as any)
              .attachments
          )
        : [];

    if (
      attachments.length === 0
    ) {
      return;
    }

    const messageId =
      this.normalizeProjectUserId(
        (msg as any)._id,
      );

    const threadId =
      this.normalizeProjectUserId(
        (msg as any).threadId,
      );

    const uploaderId =
      this.normalizeProjectUserId(
        (msg as any).userId,
      );

    const normalizedProjectId =
      String(
        projectId || '',
      ).trim();

    if (
      !Types.ObjectId.isValid(
        messageId,
      ) ||
      !Types.ObjectId.isValid(
        threadId,
      ) ||
      !Types.ObjectId.isValid(
        uploaderId,
      ) ||
      !Types.ObjectId.isValid(
        normalizedProjectId,
      )
    ) {
      throw new BadRequestException(
        'Message attachment storage context is invalid.',
      );
    }

    const messageObjectId =
      new Types.ObjectId(
        messageId,
      );

    const threadObjectId =
      new Types.ObjectId(
        threadId,
      );

    const uploaderObjectId =
      new Types.ObjectId(
        uploaderId,
      );

    const projectObjectId =
      new Types.ObjectId(
        normalizedProjectId,
      );

    const now =
      new Date();

    try {
      for (
        let index = 0;
        index < attachments.length;
        index += 1
      ) {
        const attachment: any =
          attachments[index];

        const rawFileId =
          String(
            attachment
              ?.fileId ||
            '',
          ).trim();

        /*
         * Modern attachments have a real upload-generated fileId.
         *
         * The deterministic fallback is only for unusual historical rows that
         * are missing one. It still preserves the object locator for deletion
         * retry after the message row is removed.
         */
        const registryFileId =
          rawFileId ||
          [
            'legacy-message',
            messageId,
            String(index),
          ].join(':');

        const fileName =
          String(
            attachment
              ?.fileName ||
            attachment
              ?.name ||
            'attachment',
          );

        const fileUrl =
          String(
            attachment
              ?.fileUrl ||
            attachment
              ?.url ||
            '',
          ).trim();

        const mimeType =
          String(
            attachment
              ?.mimeType ||
            attachment
              ?.mime ||
            '',
          ).trim();

        const sizeInBytes =
          Math.max(
            0,
            Number(
              attachment
                ?.fileSize ??
              attachment
                ?.size ??
              0,
            ),
          );

        const thumbnailUrl =
          String(
            attachment
              ?.thumbnailUrl ||
            attachment
              ?.thumbUrl ||
            '',
          ).trim();

        /*
         * Existing modern row:
         *   update deletionRequestedAt only.
         *
         * Historical row:
         *   upsert a synthetic consumed registry record.
         *
         * A conflicting same-fileId row cannot satisfy the exact context
         * filter and therefore fails the unique fileId constraint rather than
         * silently linking the wrong physical object to this deletion.
         */
        await this
          .teamRoomPendingUploadModel
          .updateOne(
            {
              fileId:
                registryFileId,

              projectId:
                projectObjectId,

              threadId:
                threadObjectId,

              uploaderId:
                uploaderObjectId,

              consumedMessageId:
                messageObjectId,
            },
            {
              $set: {
                deletionRequestedAt:
                  now,

                deletionReason:
                  'message_delete',
              },

              $setOnInsert: {
                fileName,

                fileUrl,

                mimeType,

                sizeInBytes,

                thumbnailUrl,

                storageProvider:
                  '',

                storageKey:
                  '',

                expiresAt:
                  now,

                consumedAt:
                  now,

                legacyBackfill:
                  true,
              },
            },
            {
              upsert:
                true,
            },
          )
          .exec();
      }
    } catch (error) {
      /*
       * The message still exists because staging happens before message
       * deletion. Reconciliation therefore safely rolls back:
       *
       * - modern deletionRequestedAt flags
       * - synthetic legacy backfill rows
       *
       * It will NOT delete a physical object while the message exists.
       */
      try {
        await this
          .teamRoomUploadCleanupService
          .reconcileDeletionRequestsForMessage(
            messageId,
          );
      } catch (
        rollbackError
      ) {
        this.logger.error(
          'Failed to roll back Team Room attachment deletion staging',
          rollbackError as any,
        );
      }

      throw error;
    }
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const msg =
      await this.findById(
        messageId,
      );

    const projectId =
      await this.requireThreadAccess(
        msg.threadId.toString(),
        userId,
        {
          // openshare-member-access-escape-v1
          // A user may always delete their own Team Room message.
          skipMemberBilling: true,
        },
      );

    if (
      !msg.userId.equals(
        new Types.ObjectId(
          userId,
        ),
      )
    ) {
      throw new ForbiddenException(
        'You can only delete your own messages',
      );
    }

    /*
     * openshare-team-room-message-delete-cleanup-v1
     *
     * Deliberately NO billing write assertion here.
     *
     * A user may always delete their own message. This is both:
     * - a privacy/data-control escape, and
     * - potentially a storage-reduction action.
     *
     * Downgrade billing may make a project read-only, but it must not trap a
     * user's own deletable content in place.
     */
    await this
      .stageThreadMessageAttachmentDeletion(
        msg,
        projectId,
      );

    const normalizedMessageId =
      this.normalizeProjectUserId(
        (msg as any)._id,
      );

    try {
      await this.messageModel
        .deleteOne({
          _id:
            msg._id,
        });
    } catch (error) {
      /*
       * Database deletion failed and the message still exists.
       * Roll deletion requests back. Physical objects remain untouched.
       */
      try {
        await this
          .teamRoomUploadCleanupService
          .reconcileDeletionRequestsForMessage(
            normalizedMessageId,
          );
      } catch (
        rollbackError
      ) {
        this.logger.error(
          'Failed to roll back Team Room attachment deletion request after message delete failure',
          rollbackError as any,
        );
      }

      throw error;
    }

    /*
     * The message is gone, so explicit deletion requests are now eligible for
     * physical cleanup.
     *
     * This is best-effort immediate cleanup. A failure does NOT resurrect the
     * message or fail the user's deletion: the durable deletionRequestedAt
     * state remains and the 15-minute cleanup cron retries later.
     */
    try {
      await this
        .teamRoomUploadCleanupService
        .reconcileDeletionRequestsForMessage(
          normalizedMessageId,
        );
    } catch (
      cleanupError
    ) {
      this.logger.error(
        'Immediate Team Room attachment cleanup failed after message deletion',
        cleanupError as any,
      );
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);

    const projectId =
      await this.requireThreadAccess(
        msg.threadId.toString(),
        userId,
      );

    await this.projectsService
      .assertProjectWritableForBilling(
        projectId,
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

    const projectId =
      await this.requireThreadAccess(
        msg.threadId.toString(),
        userId,
      );

    await this.projectsService
      .assertProjectWritableForBilling(
        projectId,
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

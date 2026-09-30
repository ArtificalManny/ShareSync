// src/uploads/uploads.controller.ts
import {
  BadRequestException,
  ServiceUnavailableException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  InjectConnection,
  InjectModel,
} from '@nestjs/mongoose';
import {
  Connection,
  Model,
  Types,
} from 'mongoose';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import { UploadsService } from './uploads.service';
import { ModerationService, ModerationDecision, ModerationCategory } from '../moderation/moderation.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { policyForUpload } from '../moderation/policy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  MessageAttachmentReceiptPayload,
  ThreadMessageAttachmentReceiptPayload,
  signMessageAttachmentReceipt,
  signThreadMessageAttachmentReceipt,
} from './message-attachment-receipt';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  TeamRoomPendingUpload,
} from './schemas/team-room-pending-upload.schema';

// Multer disk storage — saves files to /uploads with unique names
const uploadsDiskStorage = diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

// team-room-image-attachments-v1-r1
function detectMessageImageMime(
  buffer: Buffer,
):
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  const pngSignature =
    Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ]);

  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(
        pngSignature,
      )
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer
      .subarray(0, 4)
      .toString('ascii') ===
      'RIFF' &&
    buffer
      .subarray(8, 12)
      .toString('ascii') ===
      'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

function messageImageExtensionMatches(
  ext: string,
  mime: string,
): boolean {
  const normalized =
    String(ext || '')
      .toLowerCase();

  if (mime === 'image/jpeg') {
    return (
      normalized === 'jpg' ||
      normalized === 'jpeg'
    );
  }

  if (mime === 'image/png') {
    return (
      normalized === 'png'
    );
  }

  if (mime === 'image/webp') {
    return (
      normalized === 'webp'
    );
  }

  return false;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly moderationService: ModerationService,
    private readonly imageModerationService: ImageModerationService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectConnection()
    private readonly connection: Connection,

    // openshare-team-room-upload-registration-v1
    @InjectModel(
      TeamRoomPendingUpload.name,
    )
    private readonly teamRoomPendingUploadModel:
      Model<any>,
  ) {}

  // openshare-thread-upload-entitlement-v2
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
      value instanceof Types.ObjectId
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

  private async requireThreadMessageUploadAccess(
    threadIdValue: any,
    userIdValue: any,
  ): Promise<{
    threadId: string;
    projectId: string;
  }> {
    const threadId =
      this.normalizeProjectUserId(
        threadIdValue,
      );

    const userId =
      this.normalizeProjectUserId(
        userIdValue,
      );

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
      throw new ForbiddenException(
        'Authenticated user is invalid',
      );
    }

    const thread: any =
      await this.connection
        .collection('threads')
        .findOne({
          _id:
            new Types.ObjectId(
              threadId,
            ),
        });

    if (!thread) {
      throw new NotFoundException(
        'Thread not found',
      );
    }

    if (
      thread.isLocked === true
    ) {
      throw new ForbiddenException(
        'This thread is locked and cannot accept new messages',
      );
    }

    const projectId =
      this.normalizeProjectUserId(
        thread.projectId,
      );

    if (
      !projectId ||
      !Types.ObjectId.isValid(
        projectId,
      )
    ) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const project: any =
      await this.connection
        .collection('projects')
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

    // openshare-thread-upload-member-access-enforcement-v1
    //
    // This helper runs before durable upload persistence.
    // Ordinary access succeeds first; billing then decides whether this
    // preserved member remains active.
    const memberAccess =
      await this.subscriptionsService
        .getProjectMemberAccess(
          projectId,
          userId,
        );

    if (
      !memberAccess.active
    ) {
      const selectionRequired =
        memberAccess.reason ===
          'billing_member_selection_required';

      throw new ForbiddenException({
        code:
          'BILLING_MEMBER_INACTIVE',

        reason:
          memberAccess.reason,

        message:
          selectionRequired
            ? 'Your workspace membership is temporarily inactive until the project owner finishes choosing which members to keep active on the Free plan.'
            : 'Your workspace membership is inactive under the project owner’s current plan. The project owner can change the retained-member selection or upgrade to restore access.',

        projectId,

        ownerUserId:
          memberAccess.ownerUserId,

        downgradeState:
          memberAccess.downgradeState,

        memberLimit:
          memberAccess.memberLimit,

        acceptedWorkspaceMemberCount:
          memberAccess
            .acceptedWorkspaceMemberCount,

        overMemberLimit:
          memberAccess.overMemberLimit,

        retainedMember:
          memberAccess.retainedMember,

        selectionRequired:
          memberAccess.selectionRequired,
      });
    }

    return {
      threadId,
      projectId,
    };
  }

  private async assertThreadMessageUploadWritable(
    projectId: string,
  ): Promise<void> {
    const access =
      await this.subscriptionsService
        .getProjectWriteAccess(
          projectId,
        );

    if (access.writable) {
      return;
    }

    const selectionRequired =
      access.reason ===
      'billing_selection_required';

    throw new ForbiddenException({
      code:
        'BILLING_PROJECT_READ_ONLY',
      reason:
        access.reason,
      message:
        selectionRequired
          ? 'This project is temporarily read-only until the project owner chooses which projects to keep active on the Free plan.'
          : 'This project is read-only under the project owner’s current plan. Upgrade or change the retained-project selection to restore editing.',
      projectId,
      ownerUserId:
        access.ownerUserId,
      downgradeState:
        access.downgradeState,
      projectLimit:
        access.projectLimit,
      ownedProjectCount:
        access.ownedProjectCount,
      overProjectLimit:
        access.overProjectLimit,
      retainedProject:
        access.retainedProject,
      selectionRequired:
        access.selectionRequired,
    });
  }

  private async assertThreadMessageUploadStorageAvailable(
    projectId: string,
    incomingFileBytes: number,
  ): Promise<void> {
    const usage =
      await this.subscriptionsService
        .checkProjectStorageLimit(
          projectId,
          incomingFileBytes,
        );

    if (usage.allowed) {
      return;
    }

    throw new HttpException(
      {
        code:
          'STORAGE_LIMIT_EXCEEDED',
        message:
          'Storage limit exceeded. Remove files or upgrade your plan to upload more.',
        ownerUserId:
          usage.ownerUserId,
        currentUsedBytes:
          usage.current,
        incomingFileBytes:
          Math.max(
            0,
            Number(
              incomingFileBytes ||
              0,
            ),
          ),
        limitBytes:
          usage.limit,
        remainingBytes:
          usage.remaining,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  /** Generic file upload */
  @Post('file')
  @UseInterceptors(FileInterceptor('file', { storage: uploadsDiskStorage }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Missing file.');

    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = file.size || 0;
    const fsPath = (file as any).path || '';

    // 1) Safety pipeline
    const virus = await this.moderationService.virusScan(fsPath);

    // Real AI image moderation via OpenAI Vision
    let image = null;
    if (mime.startsWith('image/') && fsPath) {
      const imgResult = await this.imageModerationService.moderateImage(fsPath);
      if (imgResult.action === 'block') {
        throw new BadRequestException(imgResult.reason || 'Image rejected by AI moderation safety filters.');
      }
      // Map to policy-compatible format
      image = {
        decision: (imgResult.action === 'allow' ? 'ALLOW' : imgResult.action === 'review' ? 'REVIEW' : 'BLOCK') as ModerationDecision,
        reason: imgResult.reason,
        categories: imgResult.labels.map(l => l.name) as ModerationCategory[],
      };
    }

    const decision = policyForUpload({ ext, sizeBytes: size, mime, virus, image });

    await this.moderationService.logDecision({
      kind: 'upload',
      ext,
      size,
      mime,
      decision: decision.decision,
      reason: decision.reason,
      ts: Date.now(),
    });

    if (decision.decision === 'BLOCK') {
      throw new BadRequestException(decision.reason || 'This file is not allowed.');
    }

    // 2) Persist file — file is already on disk via Multer diskStorage
    const stored: any = await this.uploadsService.uploadFile(file);
    const moderationStatus: 'allowed' | 'pending' =
      decision.decision === 'REVIEW' ? 'pending' : 'allowed';

    // 3) Response
    return {
      ok: true,
      url: String(stored?.url),
      file: {
        id: String(stored?.id ?? stored?._id ?? stored?.url ?? Date.now()),
        url: String(stored?.url),
        thumbUrl: stored?.thumbUrl,
        name: stored?.name ?? file.originalname,
        size: Number(stored?.size ?? size),
        mime: stored?.mime ?? mime,
        moderationStatus,
      },
    };
  }

  // messages-fail-closed-attachment-upload-v1
  /**
   * Direct-message attachment upload.
   *
   * Security contract:
   * - authenticated user only
   * - currently images only
   * - image moderation must return ALLOW
   * - REVIEW is treated as blocked for Messages
   * - rejected temporary files are deleted
   * - successful uploads receive a signed receipt that MessagesService
   *   must verify before accepting the attachment
   */
  @Post('message-attachment')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          uploadsDiskStorage,
      },
    ),
  )
  async uploadMessageAttachment(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
    @Body('threadId')
    threadId?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Missing file.',
      );
    }

    const userId = String(
      req?.user?.sub ||
      req?.user?.userId ||
      req?.user?.id ||
      '',
    ).trim();

    const ext = path
      .extname(
        file.originalname ||
        '',
      )
      .slice(1)
      .toLowerCase();

    const claimedMime =
      file.mimetype ||
      'application/octet-stream';

    let mime =
      claimedMime;

    const size =
      file.size || 0;

    const fsPath =
      (file as any).path ||
      '';

    const removeRejectedTempFile =
      async () => {
        if (!fsPath) {
          return;
        }

        try {
          await fs.unlink(
            fsPath,
          );
        } catch {
          // Best-effort cleanup.
        }
      };

    if (
      !userId
    ) {
      await removeRejectedTempFile();

      throw new BadRequestException(
        'Authenticated user is required.',
      );
    }

    let threadUploadContext:
      | {
          threadId: string;
          projectId: string;
        }
      | null = null;

    const normalizedThreadId =
      String(
        threadId || '',
      ).trim();

    if (normalizedThreadId) {
      try {
        threadUploadContext =
          await this
            .requireThreadMessageUploadAccess(
              normalizedThreadId,
              userId,
            );

        await this
          .assertThreadMessageUploadWritable(
            threadUploadContext
              .projectId,
          );

        // openshare-team-room-upload-registration-v1
        // Exact incoming bytes are checked before moderation reaches durable
        // R2/local persistence. Direct Messages omit threadId and are unchanged.
        await this
          .assertThreadMessageUploadStorageAvailable(
            threadUploadContext
              .projectId,
            size,
          );
      } catch (error) {
        await removeRejectedTempFile();

        throw error;
      }
    }

    /*
     * Fail closed for Messages / Team Room.
     * Browser-provided MIME values are not trusted.
     */
    if (
      !this.imageModerationService
        .isServiceEnabled()
    ) {
      await this.moderationService
        .logDecision({
          kind: 'upload',
          userId,
          ext,
          mime: claimedMime,
          size,
          decision: 'BLOCK',
          reason:
            'Image moderation service unavailable.',
          meta: {
            surface:
              'messages',
          },
          ts: Date.now(),
        });

      await removeRejectedTempFile();

      throw new ServiceUnavailableException(
        'Image safety scanning is temporarily unavailable. Please try again later.',
      );
    }

    let imageBuffer: Buffer;

    try {
      imageBuffer =
        await fs.readFile(
          fsPath,
        );
    } catch {
      await removeRejectedTempFile();

      throw new BadRequestException(
        'This attachment could not be verified.',
      );
    }

    const detectedMime =
      detectMessageImageMime(
        imageBuffer,
      );

    if (
      !detectedMime ||
      !messageImageExtensionMatches(
        ext,
        detectedMime,
      )
    ) {
      await this.moderationService
        .logDecision({
          kind: 'upload',
          userId,
          ext,
          mime: claimedMime,
          size,
          decision: 'BLOCK',
          reason:
            'Attachment failed image signature validation.',
          meta: {
            surface:
              'messages',
          },
          ts: Date.now(),
        });

      await removeRejectedTempFile();

      throw new BadRequestException(
        'Team Room currently accepts JPG, PNG, and WebP images only.',
      );
    }

    /*
     * Persist and sign the server-detected MIME, not the
     * browser's Content-Type declaration.
     */
    mime =
      detectedMime;

    file.mimetype =
      detectedMime;

    /*
     * Do not silently allow PDFs/Office files yet.
     * Their embedded text/images are not currently passed through
     * the image moderation pipeline, and virusScan() is still only
     * a placeholder.
     */
    if (
      !mime.startsWith(
        'image/',
      )
    ) {
      await this.moderationService
        .logDecision({
          kind: 'upload',
          userId,
          ext,
          mime,
          size,
          decision: 'BLOCK',
          reason:
            'Messages currently accepts moderated image attachments only.',
          ts: Date.now(),
        });

      await removeRejectedTempFile();

      throw new BadRequestException(
        'Messages currently supports image attachments only.',
      );
    }

    let persistedThreadStored:
      | any
      | null = null;

    let persistedThreadAssetId:
      | Types.ObjectId
      | null = null;

    let threadUploadCompleted =
      false;

    try {
      const virus =
        await this.moderationService
          .virusScan(
            fsPath,
          );

      const imgResult =
        await this.imageModerationService
          .moderateImage(
            imageBuffer,
          );

      const image = {
        decision: (
          imgResult.action ===
          'allow'
            ? 'ALLOW'
            : imgResult.action ===
                'review'
              ? 'REVIEW'
              : 'BLOCK'
        ) as ModerationDecision,
        reason:
          imgResult.reason,
        categories:
          imgResult.labels.map(
            (label) =>
              label.name,
          ) as ModerationCategory[],
      };

      const decision =
        policyForUpload({
          ext,
          sizeBytes: size,
          mime,
          virus,
          image,
        });

      await this.moderationService
        .logDecision({
          kind: 'upload',
          userId,
          ext,
          mime,
          size,
          decision:
            decision.decision,
          reason:
            decision.reason,
          meta: {
            surface:
              'messages',
          },
          ts: Date.now(),
        });

      /*
       * Messages are fail-closed:
       * REVIEW is not delivered or persisted as a usable DM attachment.
       */
      if (
        decision.decision !==
        'ALLOW'
      ) {
        await removeRejectedTempFile();

        throw new BadRequestException(
          'This attachment could not be uploaded.',
        );
      }

      const stored: any =
        await this.uploadsService
          .uploadFile(
            file,
          );

      if (threadUploadContext) {
        persistedThreadStored =
          stored;
      }

      const payload:
        MessageAttachmentReceiptPayload =
      {
        version: 1,
        uploaderId:
          userId,
        fileId: String(
          stored?.id ??
          stored?._id ??
          stored?.url ??
          Date.now(),
        ),
        fileName: String(
          stored?.name ??
          file.originalname ??
          'attachment',
        ),
        fileUrl: String(
          stored?.url ||
          '',
        ),
        mimeType: String(
          stored?.mime ??
          mime,
        ),
        fileSize: Number(
          stored?.size ??
          size,
        ),
        thumbnailUrl:
          stored?.thumbUrl
            ? String(
                stored.thumbUrl,
              )
            : undefined,

        // 30 minutes to send the moderated upload into a message.
        expiresAt:
          Date.now() +
          30 * 60 * 1000,
      };

      if (
        !payload.fileUrl
      ) {
        throw new BadRequestException(
          'Attachment storage failed.',
        );
      }

      if (threadUploadContext) {
        const createdAsset =
          await this
            .teamRoomPendingUploadModel
            .create({
              fileId:
                payload.fileId,

              projectId:
                new Types.ObjectId(
                  threadUploadContext
                    .projectId,
                ),

              threadId:
                new Types.ObjectId(
                  threadUploadContext
                    .threadId,
                ),

              uploaderId:
                new Types.ObjectId(
                  userId,
                ),

              fileName:
                payload.fileName,

              fileUrl:
                payload.fileUrl,

              mimeType:
                payload.mimeType ||
                '',

              sizeInBytes:
                Math.max(
                  0,
                  Number(
                    payload.fileSize ||
                    0,
                  ),
                ),

              thumbnailUrl:
                payload.thumbnailUrl ||
                '',

              storageProvider:
                String(
                  stored
                    ?.storageProvider ||
                  '',
                ),

              storageKey:
                String(
                  stored
                    ?.storageKey ||
                  '',
                ),

              expiresAt:
                new Date(
                  payload.expiresAt,
                ),

              consumedMessageId:
                null,

              consumedAt:
                null,
            });

        persistedThreadAssetId =
          createdAsset._id;

        /*
         * Fail closed after registration too. The registry row is already
         * included by authoritative storage accounting, so this catches the
         * normal concurrent-upload case without manually incrementing a
         * billing counter.
         */
        await this
          .assertThreadMessageUploadStorageAvailable(
            threadUploadContext
              .projectId,
            0,
          );
      }

      let receipt: string;

      if (threadUploadContext) {
        const threadPayload:
          ThreadMessageAttachmentReceiptPayload =
        {
          version: 2,
          uploaderId:
            payload.uploaderId,
          threadId:
            threadUploadContext
              .threadId,
          projectId:
            threadUploadContext
              .projectId,
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
          expiresAt:
            payload.expiresAt,
        };

        receipt =
          signThreadMessageAttachmentReceipt(
            threadPayload,
          );
      } else {
        receipt =
          signMessageAttachmentReceipt(
            payload,
          );
      }

      threadUploadCompleted =
        true;

      return {
        ok: true,
        file: {
          id:
            payload.fileId,
          name:
            payload.fileName,
          url:
            payload.fileUrl,
          mime:
            payload.mimeType,
          size:
            payload.fileSize,
          thumbUrl:
            payload.thumbnailUrl,
          moderationStatus:
            'allowed',
          receipt,
          receiptExpiresAt:
            payload.expiresAt,
        },
      };
    } catch (error) {
      if (
        threadUploadContext &&
        persistedThreadStored &&
        !threadUploadCompleted
      ) {
        let physicalObjectDeleted =
          false;

        try {
          await this.uploadsService
            .deleteStoredObject({
              url:
                String(
                  persistedThreadStored
                    ?.url ||
                  '',
                ),

              storageProvider:
                String(
                  persistedThreadStored
                    ?.storageProvider ||
                  '',
                ),

              storageKey:
                String(
                  persistedThreadStored
                    ?.storageKey ||
                  '',
                ),
            });

          physicalObjectDeleted =
            true;
        } catch (
          cleanupError
        ) {
          /*
           * Fail safe: when physical cleanup fails, retain any existing asset
           * registry row so the bytes remain accounted and a later cleanup
           * worker can retry instead of silently losing object metadata.
           */
          console.error(
            'Team Room upload rollback could not delete stored object',
            cleanupError,
          );
        }

        if (
          physicalObjectDeleted &&
          persistedThreadAssetId
        ) {
          try {
            await this
              .teamRoomPendingUploadModel
              .deleteOne({
                _id:
                  persistedThreadAssetId,
                consumedMessageId:
                  null,
              })
              .exec();
          } catch (
            metadataCleanupError
          ) {
            /*
             * Leaving a metadata row after its physical object was removed is
             * safer than deleting metadata before object cleanup. The later
             * cleanup phase can reconcile it idempotently.
             */
            console.error(
              'Team Room upload rollback could not delete asset metadata',
              metadataCleanupError,
            );
          }
        }
      }

      /*
       * If durable storage never happened, this removes the Multer temp file.
       * After R2/local persistence it simply becomes a best-effort no-op.
       */
      await removeRejectedTempFile();

      throw error;
    }
  }

  /** Avatar-specific upload */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: uploadsDiskStorage }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Missing avatar file.');

    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = file.size || 0;

    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image.');
    }

    const fsPath = (file as any).path || '';

    // 1) Safety pipeline
    const virus = await this.moderationService.virusScan(fsPath);

    // Real AI image moderation via OpenAI Vision
    const imgResult = await this.imageModerationService.moderateImage(fsPath);
    if (imgResult.action === 'block') {
      throw new BadRequestException(imgResult.reason || 'Avatar rejected by AI moderation safety filters.');
    }
    const image = {
      decision: (imgResult.action === 'allow' ? 'ALLOW' : imgResult.action === 'review' ? 'REVIEW' : 'BLOCK') as ModerationDecision,
      reason: imgResult.reason,
      categories: imgResult.labels.map(l => l.name) as ModerationCategory[],
    };

    const decision = policyForUpload({ ext, sizeBytes: size, mime, virus, image });

    await this.moderationService.logDecision({
      kind: 'upload',
      ext,
      size,
      mime,
      decision: decision.decision,
      reason: decision.reason,
      ts: Date.now(),
    });

    if (decision.decision === 'BLOCK') {
       throw new BadRequestException(decision.reason || 'This avatar is not allowed.');
    }

    // 2) Persist avatar — file is already on disk via Multer diskStorage
    const stored: any = await this.uploadsService.uploadFile(file);

    const moderationStatus: 'allowed' | 'pending' =
      decision.decision === 'REVIEW' ? 'pending' : 'allowed';

    const url = String(stored?.url);
    return {
      ok: true,
      url,
      avatarUrl: url,
      thumbUrl: stored?.thumbUrl,
      moderationStatus,
    };
  }
}

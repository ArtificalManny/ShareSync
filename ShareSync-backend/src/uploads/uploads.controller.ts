// src/uploads/uploads.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import { UploadsService } from './uploads.service';
import { ModerationService, ModerationDecision, ModerationCategory } from '../moderation/moderation.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { policyForUpload } from '../moderation/policy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  MessageAttachmentReceiptPayload,
  signMessageAttachmentReceipt,
} from './message-attachment-receipt';

// Multer disk storage — saves files to /uploads with unique names
const uploadsDiskStorage = diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly moderationService: ModerationService,
    private readonly imageModerationService: ImageModerationService,
  ) {}

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

    const mime =
      file.mimetype ||
      'application/octet-stream';

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

    try {
      const virus =
        await this.moderationService
          .virusScan(
            fsPath,
          );

      const imgResult =
        await this.imageModerationService
          .moderateImage(
            fsPath,
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

      const receipt =
        signMessageAttachmentReceipt(
          payload,
        );

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
      /*
       * If storage has not happened yet this removes the Multer temp file.
       * If uploadFile() already moved/consumed it, unlink simply no-ops.
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

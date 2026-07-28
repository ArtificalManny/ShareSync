// src/uploads/uploads.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';

import { UploadsService } from './uploads.service';
import { ModerationService, ModerationDecision, ModerationCategory } from '../moderation/moderation.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { policyForUpload } from '../moderation/policy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

// src/uploads/uploads.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'node:path';

import { UploadsService } from './uploads.service';
import { ModerationService } from '../moderation/moderation.service';
import { policyForUpload } from '../moderation/policy';

@Controller('uploads') // global 'api' prefix is set in main.ts
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly moderationService: ModerationService,
  ) {}

  /** Generic file upload (kept as-is) */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<
    | { ok: false; moderation: { status: 'blocked'; reason?: string; caseId?: string } }
    | {
        ok: true;
        file: {
          id: string;
          url: string;
          thumbUrl?: string;
          name: string;
          size: number;
          mime: string;
          moderationStatus: 'allowed' | 'pending';
        };
      }
  > {
    if (!file) throw new BadRequestException('Missing file.');

    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = file.size || 0;
    const fsPath = (file as any).path || ''; // Multer disk storage sets .path

    // 1) Safety pipeline
    const virus = await this.moderationService.virusScan(fsPath);
    const image = mime.startsWith('image/')
      ? await this.moderationService.checkImage(fsPath)
      : null;

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
      return {
        ok: false,
        moderation: {
          status: 'blocked',
          reason: decision.reason || 'This file is not allowed.',
        },
      };
    }

    // 2) Persist file
    const stored: any = await this.uploadsService.uploadFile(file);
    const moderationStatus: 'allowed' | 'pending' =
      decision.decision === 'REVIEW' ? 'pending' : 'allowed';

    // 3) Response
    return {
      ok: true,
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

  /**
   * Avatar-specific upload
   * - Only images allowed (png/jpg/webp/gif…)
   * - Reuses moderation pipeline
   * - Returns minimal `{ url }` (also `avatarUrl`) for Profile.jsx compatibility
   *
   * NOTE: If you later add resizing/WEBP variants, implement in UploadsService
   * (e.g., `uploadAvatar(file)` that returns { url, thumbUrl, blurhash }).
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<
    | { ok: false; moderation: { status: 'blocked'; reason?: string; caseId?: string } }
    | {
        ok: true;
        url: string;             // <- Profile.jsx reads either `url` or `avatarUrl`
        avatarUrl: string;       // duplicate for safety
        thumbUrl?: string;
        moderationStatus: 'allowed' | 'pending';
        // blurhash?: string;     // add if your service provides it
      }
  > {
    if (!file) throw new BadRequestException('Missing avatar file.');

    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = file.size || 0;

    // Enforce images only (avatar)
    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image.');
    }

    const fsPath = (file as any).path || '';

    // 1) Safety pipeline
    const virus = await this.moderationService.virusScan(fsPath);
    const image = await this.moderationService.checkImage(fsPath);

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
      return {
        ok: false,
        moderation: {
          status: 'blocked',
          reason: decision.reason || 'This avatar is not allowed.',
        },
      };
    }

    // 2) Persist avatar
    // If you add a dedicated method later (e.g., resize/webp), call it here:
    //   const stored = await this.uploadsService.uploadAvatar(file);
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
      // blurhash: stored?.blurhash,
    };
  }
}
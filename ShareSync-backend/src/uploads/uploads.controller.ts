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

    // If you're using disk storage, Multer sets file.path; with memory storage it may be undefined.
    // Your ModerationService currently expects one arg, so we pass the fs path (or empty string).
    const fsPath = (file as any).path || '';

    // 1) Safety pipeline (best-effort)
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

    // 2) Persist file (service may currently only return { url })
    const stored: any = await this.uploadsService.uploadFile(file);

    const moderationStatus: 'allowed' | 'pending' =
      decision.decision === 'REVIEW' ? 'pending' : 'allowed';

    // 3) Response normalized for the frontend
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
}
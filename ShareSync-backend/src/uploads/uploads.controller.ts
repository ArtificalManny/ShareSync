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

@Controller('api/uploads')
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

    const virus = await this.moderationService.virusScan((file as any).path || '');
    const image =
      mime.startsWith('image/') ? await this.moderationService.checkImage((file as any).path || '') : null;

    const decision = policyForUpload({ ext, sizeBytes: size, mime, virus, image });

    await this.moderationService.logDecision({
      kind: 'upload',
      ext, size, mime,
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

    // NOTE: your service might currently return only { url }
    const stored: any = await this.uploadsService.uploadFile(file);

    const moderationStatus = decision.decision === 'REVIEW' ? 'pending' : 'allowed';

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
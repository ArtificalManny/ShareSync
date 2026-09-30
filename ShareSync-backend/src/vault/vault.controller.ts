import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { ModerationService } from '../moderation/moderation.service';
import { policyForUpload } from '../moderation/policy';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VaultService } from './vault.service';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

// Multer disk storage — saves vault files to /uploads with unique names
const vaultDiskStorage = diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uniqueName = `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

@ApiTags('Vault')
@ApiBearerAuth()
@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly imageModerationService: ImageModerationService,
    private readonly moderationService: ModerationService,
  ) {}

  @Get('project/:projectId')
  async getProjectVault(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = req.user?.sub || req.user?.userId;
    const data = await this.vaultService.getProjectVault(projectId, userId);
    return { success: true, data };
  }

  @Post('folders')
  @UseInterceptors(TextModerationInterceptor)
  async createFolder(
    @Req() req: any,
    @Body('projectId') projectId: string,
    @Body('name') name: string,
    @Body('accessLevel') accessLevel: 'public' | 'private',
    @Body('allowedUsers') allowedUsers?: string[]
  ) {
    const userId = req.user?.sub || req.user?.userId;
    if (!projectId || !name) throw new BadRequestException('Project ID and folder name are required.');

    const folder = await this.vaultService.createFolder(projectId, userId, name, accessLevel || 'public', allowedUsers);
    return { success: true, data: folder };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: vaultDiskStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string' },
        folderId: { type: 'string' },
      },
    },
  })
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Body('folderId') folderId?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!file) throw new BadRequestException('No file provided');
    if (!projectId) throw new BadRequestException('Project ID is required');

    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    const mime = file.mimetype || 'application/octet-stream';
    const size = file.size || 0;
    const fsPath = (file as any).path || '';

    // openshare-vault-moderation-cleanup-v1
    // This helper is used only before VaultService persistence begins.
    // Once VaultService takes ownership of the file, cleanup is handled
    // by the storage pipeline instead.
    const removeRejectedTempFile =
      async (): Promise<void> => {
        const tempPath =
          String(
            (file as any)?.path || '',
          ).trim();

        if (!tempPath) {
          return;
        }

        try {
          await fs.unlink(tempPath);
        } catch (cleanupError: any) {
          // Missing is expected if another pre-persist guard already
          // cleaned the same Multer file. Cleanup must never hide the
          // original moderation error.
          if (
            cleanupError?.code !==
            'ENOENT'
          ) {
            // Intentionally non-fatal.
          }
        }
      };

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // FULL MODERATION PIPELINE (matches /api/uploads/file)
    // ═══════════════════════════════════════════════════════════════════════

    // 1) Virus scan
    const virus = await this.moderationService.virusScan(fsPath);

    // 2) Real AI image moderation via OpenAI Vision
    let image = null;
    if (mime.startsWith('image/') && fsPath) {
      const imgResult = await this.imageModerationService.moderateImage(fsPath);
      if (imgResult.action === 'block') {
        throw new BadRequestException(imgResult.reason || 'Image rejected by AI moderation safety filters.');
      }
      image = {
        decision: imgResult.action === 'allow' ? 'ALLOW' : imgResult.action === 'review' ? 'REVIEW' : 'BLOCK',
        reason: imgResult.reason,
        categories: imgResult.labels.map(l => l.name),
      };
    }

    // 3) Policy decision
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

    } catch (error) {
      await removeRejectedTempFile();
      throw error;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE QUOTA + PERSIST
    // ═══════════════════════════════════════════════════════════════════════

    // Deliberately outside the moderation catch:
    // VaultService owns quota cleanup and persistence from this point on.
    const uploadedFile = await this.vaultService.uploadFile(projectId, userId, file, folderId);
    return { success: true, data: uploadedFile };
  }
  @Patch('files/:fileId')
  @UseInterceptors(TextModerationInterceptor)
  async renameFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
    @Body('originalName') originalName?: string,
    @Body('name') name?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    const nextName = originalName || name;

    if (!nextName) {
      throw new BadRequestException('File name is required');
    }

    const file = await this.vaultService.renameFile(fileId, userId, nextName);

    return {
      success: true,
      data: file,
      message: 'File renamed',
    };
  }

  @Patch('files/:fileId/move')
  async moveFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
    @Body('folderId') folderId?: string | null,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    const file = await this.vaultService.moveFile(fileId, userId, folderId || null);

    return {
      success: true,
      data: file,
      message: 'File moved',
    };
  }

  @Delete('files/:fileId')
  async deleteFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    await this.vaultService.deleteFile(fileId, userId);

    return {
      success: true,
      message: 'File deleted',
    };
  }

}

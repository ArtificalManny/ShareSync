import {
  Controller, Get, Post, Body, Param, Req, UseGuards, 
  UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VaultService } from './vault.service';

@ApiTags('Vault')
@ApiBearerAuth()
@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly imageModerationService: ImageModerationService,
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
  @UseInterceptors(FileInterceptor('file'))
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

    // Image moderation — scan before storing
    if (file.mimetype?.startsWith('image/') && file.buffer) {
      const modResult = await this.imageModerationService.moderateImage(file.buffer);
      if (modResult.action === 'block') {
        throw new BadRequestException({
          error: 'Content Policy Violation',
          message: 'This image violates our community guidelines and cannot be uploaded.',
          code: 'IMAGE_BLOCKED',
        });
      }
    }

    const uploadedFile = await this.vaultService.uploadFile(projectId, userId, file, folderId);
    return { success: true, data: uploadedFile };
  }
}

// src/files/files.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILES CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import {
  CreateFileDto,
  UpdateFileDto,
  CreateFolderDto,
  UpdateFolderDto,
  FileQueryDto,
  MoveFileDto,
  MoveFolderDto,
  UploadNewVersionDto,
} from './dto/file.dto';
import { FileType } from './schemas/file.schema';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  // openshare-files-project-membership-v1
  // Every route below proves project membership before doing anything else.
  private userIdFrom(req: any): string {
    return String(req?.user?.userId || req?.user?.sub || req?.user?.id || '');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a file record (after upload to storage)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File created' })
  async createFile(@Req() req: any, @Body() dto: CreateFileDto) {
    const userId = this.userIdFrom(req);
    await this.filesService.assertProjectAccess(dto.projectId, userId);
    await this.filesService.assertFolderInProject(dto.folderId, dto.projectId, userId);
    const file = await this.filesService.createFile(req.user.userId, dto);
    return {
      success: true,
      data: file,
    };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get files in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiQuery({ name: 'type', enum: FileType, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'starredOnly', type: Boolean, required: false })
  async findByProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query() query: FileQueryDto,
  ) {
    await this.filesService.assertProjectAccess(projectId, this.userIdFrom(req));
    const result = await this.filesService.findByProject(projectId, query);
    return {
      success: true,
      data: result.files,
      meta: {
        total: result.total,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const file = await this.filesService.findById(id);

    // Track view
    await this.filesService.incrementViewCount(id);

    return {
      success: true,
      data: file,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFileDto) {
    const userId = this.userIdFrom(req);
    const projectId = await this.filesService.assertFileAccess(id, userId);
    await this.filesService.assertFolderInProject(dto.folderId, projectId, userId);
    const file = await this.filesService.update(id, dto);
    return {
      success: true,
      data: file,
    };
  }

  @Patch(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move a file to another folder' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async moveFile(@Req() req: any, @Param('id') id: string, @Body() dto: MoveFileDto) {
    const userId = this.userIdFrom(req);
    const projectId = await this.filesService.assertFileAccess(id, userId);
    await this.filesService.assertFolderInProject(dto.targetFolderId, projectId, userId);
    const file = await this.filesService.moveFile(id, dto.targetFolderId);
    return {
      success: true,
      data: file,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    await this.filesService.delete(id);
    return {
      success: true,
      message: 'File deleted',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSIONING
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/versions')
  @ApiOperation({ summary: 'Upload a new version' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async uploadNewVersion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UploadNewVersionDto,
  ) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const file = await this.filesService.uploadNewVersion(
      id,
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: file,
    };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get file versions' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async getVersions(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const versions = await this.filesService.getVersions(id);
    return {
      success: true,
      data: versions,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STARRING & ARCHIVE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/star')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle file star' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async toggleStar(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const result = await this.filesService.toggleStar(id, req.user.userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async archive(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const file = await this.filesService.archive(id);
    return {
      success: true,
      data: file,
    };
  }

  @Post(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unarchive a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async unarchive(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const file = await this.filesService.unarchive(id);
    return {
      success: true,
      data: file,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DOWNLOAD
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL (and track download)' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async download(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFileAccess(id, this.userIdFrom(req));
    const file = await this.filesService.findById(id);

    // Track download
    await this.filesService.incrementDownloadCount(id);

    return {
      success: true,
      data: {
        url: file.url,
        name: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLDER CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('folders')
  @ApiOperation({ summary: 'Create a folder' })
  async createFolder(@Req() req: any, @Body() dto: CreateFolderDto) {
    const userId = this.userIdFrom(req);
    await this.filesService.assertProjectAccess(dto.projectId, userId);
    await this.filesService.assertFolderInProject(dto.parentId, dto.projectId, userId);
    const folder = await this.filesService.createFolder(req.user.userId, dto);
    return {
      success: true,
      data: folder,
    };
  }

  @Get('folders/project/:projectId')
  @ApiOperation({ summary: 'Get folders in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'parentId', required: false })
  async findFoldersByProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('parentId') parentId?: string,
  ) {
    await this.filesService.assertProjectAccess(projectId, this.userIdFrom(req));
    const folders = await this.filesService.findFoldersByProject(projectId, parentId);
    return {
      success: true,
      data: folders,
    };
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get a folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async findFolderById(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFolderAccess(id, this.userIdFrom(req));
    const folder = await this.filesService.findFolderById(id);
    return {
      success: true,
      data: folder,
    };
  }

  @Get('folders/:id/contents')
  @ApiOperation({ summary: 'Get folder contents (subfolders and files)' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async getFolderContents(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFolderAccess(id, this.userIdFrom(req));
    const folder = await this.filesService.findFolderById(id);
    const contents = await this.filesService.getFolderContents(
      folder.projectId.toString(),
      id,
    );
    return {
      success: true,
      data: contents,
    };
  }

  @Get('project/:projectId/root')
  @ApiOperation({ summary: 'Get root folder contents' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getRootContents(@Req() req: any, @Param('projectId') projectId: string) {
    await this.filesService.assertProjectAccess(projectId, this.userIdFrom(req));
    const contents = await this.filesService.getFolderContents(projectId);
    return {
      success: true,
      data: contents,
    };
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async updateFolder(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFolderDto) {
    await this.filesService.assertFolderAccess(id, this.userIdFrom(req));
    const folder = await this.filesService.updateFolder(id, dto);
    return {
      success: true,
      data: folder,
    };
  }

  @Patch('folders/:id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async moveFolder(@Req() req: any, @Param('id') id: string, @Body() dto: MoveFolderDto) {
    const userId = this.userIdFrom(req);
    const projectId = await this.filesService.assertFolderAccess(id, userId);
    await this.filesService.assertFolderInProject(dto.targetParentId || null, projectId, userId);
    const folder = await this.filesService.moveFolder(id, dto.targetParentId || null);
    return {
      success: true,
      data: folder,
    };
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a folder (must be empty)' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async deleteFolder(@Req() req: any, @Param('id') id: string) {
    await this.filesService.assertFolderAccess(id, this.userIdFrom(req));
    await this.filesService.deleteFolder(id);
    return {
      success: true,
      message: 'Folder deleted',
    };
  }
}

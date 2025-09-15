import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
    BadRequestException,
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { FilesService } from './files.service';
  import {
    ProjectPermissionGuard,
    CanViewProject,
    CanEditProject,
    CanManageProject,
  } from '../projects/guards/project-permission.guard';
  
  type FileInputCommon = {
    storageKey: string;
    url?: string;
    thumbKey?: string;
    thumbUrl?: string;
    name: string;
    size: number;
    mime: string;
    kind?: 'image' | 'video' | 'doc' | 'audio' | 'other';
    status?: 'pending' | 'approved' | 'blocked';
    moderation?: { reason?: string; tags?: string[] };
  };
  
  type CreateFileBody =
    | { file: FileInputCommon }
    | { files: Array<FileInputCommon> };
  
  @UseGuards(JwtAuthGuard, ProjectPermissionGuard)
  @Controller('projects/:projectId/files')
  export class FilesController {
    constructor(private readonly files: FilesService) {}
  
    /**
     * Upload/link files into a project (after upload returns URLs/keys).
     * Requires editor+ role.
     */
    @Post()
    @CanEditProject()
    async create(
      @Req() req,
      @Param('projectId') projectId: string,
      @Body() body: CreateFileBody,
    ) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      if (!projectId) throw new BadRequestException('projectId is required');
  
      if ((body as any).file) {
        const f = (body as any).file;
        return this.files.createOne(
          {
            storageKey: f.storageKey,
            url: f.url,
            thumbKey: f.thumbKey,
            thumbUrl: f.thumbUrl,
            name: f.name,
            size: Number(f.size || 0),
            mime: f.mime,
            kind: f.kind,
            projectId,
            status: f.status,
            moderation: f.moderation,
          },
          userId,
        );
      }
  
      if (Array.isArray((body as any).files)) {
        const list = (body as any).files;
        return this.files.createMany(
          projectId,
          list.map((f: any) => ({
            storageKey: f.storageKey,
            url: f.url,
            thumbKey: f.thumbKey,
            thumbUrl: f.thumbUrl,
            name: f.name,
            size: Number(f.size || 0),
            mime: f.mime,
            kind: f.kind,
            projectId,
            status: f.status,
            moderation: f.moderation,
          })),
          userId,
        );
      }
  
      throw new BadRequestException('Provide either {file} or {files[]}');
    }
  
    /** List project files (cursor pagination). Requires viewer+ role. */
    @Get()
    @CanViewProject()
    async listByProject(
      @Req() req,
      @Param('projectId') projectId: string,
      @Query('cursor') cursor?: string,
      @Query('limit') limit?: string,
    ) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      return this.files.listByProject(projectId, userId, {
        cursor: cursor || null,
        limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
      });
    }
  
    /**
     * Delete a file from project.
     * Using @CanManageProject (owner) here; relax to @CanEditProject if desired.
     */
    @Delete(':fileId')
    @CanManageProject()
    async remove(
      @Req() req,
      @Param('projectId') _projectId: string,
      @Param('fileId') fileId: string,
    ) {
      const userId = req?.user?.sub || req?.user?.id || req?.user?._id;
      return this.files.remove(fileId, userId);
    }
  }  
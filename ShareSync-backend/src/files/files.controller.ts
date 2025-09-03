// src/files/files.controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
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
  
  type CreateFileBody =
    | {
        file: {
          url: string;
          thumbUrl?: string;
          name: string;
          size: number;
          mime: string;
          moderationStatus?: 'allowed' | 'pending' | 'blocked';
        };
      }
    | {
        files: Array<{
          url: string;
          thumbUrl?: string;
          name: string;
          size: number;
          mime: string;
          moderationStatus?: 'allowed' | 'pending' | 'blocked';
        }>;
      };
  
  @Controller('projects/:projectId/files')
  @UseGuards(JwtAuthGuard, ProjectPermissionGuard)
  export class FilesController {
    constructor(private readonly files: FilesService) {}
  
    /**
     * Upload/link files into a project
     * Requires editor+ role
     */
    @Post()
    @CanEditProject()
    async create(
      @Req() req,
      @Param('projectId') projectId: string,
      @Body() body: CreateFileBody,
    ) {
      const userId = req?.user?.sub;
      if (!projectId) throw new BadRequestException('projectId is required');
  
      if ((body as any).file) {
        const f = (body as any).file;
        return this.files.createOne(
          {
            url: f.url,
            thumbUrl: f.thumbUrl,
            name: f.name,
            size: Number(f.size || 0),
            mime: f.mime,
            projectId,
            moderationStatus: f.moderationStatus,
          },
          userId,
        );
      }
  
      if (Array.isArray((body as any).files)) {
        const list = (body as any).files;
        return this.files.createMany(
          projectId,
          list.map((f: any) => ({
            url: f.url,
            thumbUrl: f.thumbUrl,
            name: f.name,
            size: Number(f.size || 0),
            mime: f.mime,
            projectId,
            moderationStatus: f.moderationStatus,
          })),
          userId,
        );
      }
  
      throw new BadRequestException('Provide either {file} or {files[]}');
    }
  
    /**
     * List project files
     * Requires viewer+ role
     */
    @Get()
    @CanViewProject()
    async listByProject(@Req() req, @Param('projectId') projectId: string) {
      const userId = req?.user?.sub;
      return this.files.listByProject(projectId, userId);
    }
  
    /**
     * Delete a file from project
     * Requires owner role
     */
    @Delete(':fileId')
    @CanManageProject()
    async remove(
      @Req() req,
      @Param('projectId') projectId: string,
      @Param('fileId') fileId: string,
    ) {
      const userId = req?.user?.sub;
      return this.files.remove(fileId, userId);
    }
  }  
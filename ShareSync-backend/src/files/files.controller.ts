// src/files/files.controller.ts
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
  
  type CreateFileBody =
    | {
        // single
        projectId: string;
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
        // bulk
        projectId: string;
        files: Array<{
          url: string;
          thumbUrl?: string;
          name: string;
          size: number;
          mime: string;
          moderationStatus?: 'allowed' | 'pending' | 'blocked';
        }>;
      };
  
  @Controller('files')
  @UseGuards(JwtAuthGuard)
  export class FilesController {
    constructor(private readonly files: FilesService) {}
  
    /**
     * Link an uploaded file (from /api/uploads/file) into a project.
     * Accepts either { projectId, file: {...} } or { projectId, files: [...] }
     */
    @Post()
    async create(@Req() req, @Body() body: CreateFileBody) {
      const userId = req?.user?.sub;
      const projectId = (body as any)?.projectId;
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
  
    /** List files for a project (role ≥ viewer). */
    @Get('by-project/:projectId')
    async listByProject(@Req() req, @Param('projectId') projectId: string) {
      const userId = req?.user?.sub;
      return this.files.listByProject(projectId, userId);
    }
  
    /** Delete a file (role ≥ member). */
    @Delete(':id')
    async remove(@Req() req, @Param('id') id: string) {
      const userId = req?.user?.sub;
      return this.files.remove(id, userId);
    }
  }
  
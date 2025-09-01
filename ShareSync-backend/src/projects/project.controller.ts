// src/projects/project.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  CanManageProject,
  CanViewProject,
  ProjectPermissionGuard,
} from './guards/project-permission.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!dto?.title || !dto?.description) {
      throw new HttpException('title and description are required', HttpStatus.BAD_REQUEST);
    }

    const doc = await this.projects.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      category: dto.category ?? '',
      status: dto.status ?? 'Not Started',
      privacy: dto.privacy ?? 'Private',
      members: Array.isArray(dto.members)
        ? dto.members.map((m: any) => ({
            email: m?.email,
            userId: m?.userId, // may be undefined in your current DTO; 'any' avoids TS error
            role: (['owner', 'member', 'viewer'] as const).includes(
              String(m?.role || 'member').toLowerCase() as any,
            )
              ? (String(m.role).toLowerCase() as 'owner' | 'member' | 'viewer')
              : 'member',
          }))
        : [],
      userId, // owner
    });

    return doc;
  }

  @Get()
  async list(@Req() req) {
    const userId = req?.user?.sub;
    return this.projects.findAll(userId);
  }

  @Get(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getOne(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.projects.findOneForUser(userId, id);
    if (!project) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return project;
  }

  // Minimal quick list used by the Home "Your Projects" rail
  @Get('quick')
  async quick(@Req() req, @Query('limit') limit = '6') {
    const userId = req?.user?.sub;
    const n = Math.max(1, Math.min(12, parseInt(limit as string, 10) || 6));

    let items: any[] = [];
    try {
      items = (await (this.projects as any).findMany?.({ userId, limit: n })) ?? [];
    } catch (_) {
      items = await this.projects.findAll(userId);
    }

    return (items || [])
      .slice(0, n)
      .map((p: any) => ({
        _id: String(p._id ?? p.id ?? ''),
        title: p.title ?? 'Untitled',
        avatar: p.avatar ?? p.projectImage ?? '',
        lastActivityAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        unreadCount: 0,
      }));
  }

  /** Update members/roles — owner-only */
  @Patch(':id/members')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async updateMembers(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { members: Array<{ userId?: string; email?: string; role?: 'owner' | 'member' | 'viewer' }> },
  ) {
    const userId = req?.user?.sub;
    if (!Array.isArray(body?.members)) {
      throw new HttpException('members[] is required', HttpStatus.BAD_REQUEST);
    }
    const updated = await this.projects.updateMembers(id, userId, body.members as any);
    if (!updated) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return updated;
  }
}
// backend/src/projects/project.controller.ts
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
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  CanManageProject,
  CanViewProject,
  ProjectPermissionGuard,
} from './guards/project-permission.guard';
import { UpdateProjectIconDto } from './dto/update-project-icon.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly project: ProjectsService,
    @Inject('REALTIME_GATEWAY') private readonly realtime: any,   // ← FIXED
  ) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!dto?.title?.trim()) {
      throw new HttpException('Title is required', HttpStatus.BAD_REQUEST);
    }

    const doc = await this.project.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      category: dto.category ?? '',
      status: dto.status ?? 'Not Started',
      privacy: dto.privacy ?? 'Private',
      members: (dto.members ?? []).map(m => ({
        ...m,
        role: m.role ?? 'member',
        addedAt: new Date(),
      })),
      userId,
    });

    try {
      this.realtime?.emitToProject?.(doc._id.toString(), 'project:created', {
        projectId: doc._id.toString(),
        project: doc,
      });
    } catch {}

    return doc;
  }

  @Get('quick')
  async quick(@Req() req, @Query('limit') limit = '6') {
    const userId = req?.user?.sub;
    const n = Math.max(1, Math.min(12, parseInt(limit as string, 10) || 6));

    const items = await this.project.findAll(userId);
    return (items || [])
      .slice(0, n)
      .map((p: any) => ({
        _id: String(p._id),
        title: p.title ?? 'Untitled',
        avatar: p.avatar ?? '',
        lastActivityAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        unreadCount: 0,
      }));
  }

  @Get()
  async list(@Req() req, @Query() query: any) {
    const userId = req?.user?.sub;
    return this.project.list(userId, query);
  }

  @Get(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getOne(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Patch(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() body: Partial<CreateProjectDto>,
  ) {
    const userId = req?.user?.sub;
    const updated = await this.project.update(id, userId, {
      ...body,
      members: body.members?.map(m => ({
        ...m,
        role: m.role ?? 'member',
        addedAt: new Date(),
      })),
    });
    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    try {
      this.realtime?.emitToProject?.(id, 'project:updated', {
        projectId: id,
        patch: body,
      });
    } catch {}

    return updated;
  }

  @Post(':id/ship')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async ship(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const result = await this.project.shipProject(id, userId);

    try {
      this.realtime?.emitToProject?.(id, 'project:shipped', {
        projectId: id,
        shippedAt: new Date().toISOString(),
      });
    } catch {}

    return result;
  }

  @Patch(':id/members')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async updateMembers(
    @Req() req,
    @Param('id') id: string,
    @Body()
    body: {
      members: Array<{
        userId?: string;
        email?: string;
        role?: 'owner' | 'member' | 'viewer';
      }>;
    },
  ) {
    const userId = req?.user?.sub;
    if (!Array.isArray(body?.members)) {
      throw new HttpException('members[] is required', HttpStatus.BAD_REQUEST);
    }
    const updated = await this.project.updateMembers(
      id,
      userId,
      body.members.map(m => ({
        ...m,
        role: m.role ?? 'member',
        addedAt: new Date(),
      })),
    );
    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    try {
      this.realtime?.emitToProject?.(id, 'project:membersUpdated', {
        projectId: id,
        members: updated.members,
        invites: updated.invites || [],
      });
    } catch {}

    return updated;
  }

  @Patch(':id/icon')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async updateIcon(
    @Req() req,
    @Param('id') id: string,
    @Body() body: UpdateProjectIconDto | null,
  ) {
    const userId = req?.user?.sub;

    const icon =
      body && typeof body === 'object' && (body as any).kind && (body as any).value
        ? { kind: body.kind as 'emoji' | 'svg', value: String(body.value || '').trim() }
        : null;

    const updated = await this.project.updateIcon(id, userId, icon);
    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    try {
      this.realtime?.emitToProject?.(id, 'project:updated', {
        projectId: id,
        patch: { icon: updated.icon ?? null },
      });
    } catch {}

    return { projectId: id, patch: { icon: updated.icon ?? null } };
  }
}
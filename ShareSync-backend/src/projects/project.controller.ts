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
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateProjectIconDto } from './dto/update-project-icon.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!dto?.title || !dto?.description) {
      throw new HttpException(
        'title and description are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const doc = await this.projects.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      category: dto.category ?? '',
      status: dto.status ?? 'Not Started',
      privacy: dto.privacy ?? 'Private',
      // pass raw members, service will normalize
      members: (dto as any).members ?? [],
      userId, // legacy owner link
    });

    return doc;
  }

  // Put "quick" before ":id" so param route doesn’t catch it
  @Get('quick')
  async quick(@Req() req, @Query('limit') limit = '6') {
    const userId = req?.user?.sub;
    const n = Math.max(1, Math.min(12, parseInt(limit as string, 10) || 6));

    let items: any[] = [];
    try {
      items =
        (await (this.projects as any).findMany?.({ userId, limit: n })) ?? [];
    } catch {
      items = await this.projects.findAll(userId);
    }

    return (items || [])
      .slice(0, n)
      .map((p: any) => ({
        _id: String(p._id ?? p.id ?? ''),
        title: p.title ?? 'Untitled',
        avatar: p.avatar ?? p.projectImage ?? '',
        lastActivityAt:
          p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        unreadCount: 0,
      }));
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
    if (!project) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return project;
  }

  /** Update members/roles — owner-only */
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
    const updated = await this.projects.updateMembers(
      id,
      userId,
      body.members as any,
    );
    if (!updated) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  /** Update icon — owner-only; emits realtime project:updated
   *  - Send { kind, value } to set/update the icon
   *  - Send an empty body (or null) to clear the icon
   */
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

    const updated = await this.projects.updateIcon(id, userId, icon);

    // Realtime fan-out (non-blocking)
    try {
      this.realtime.emitToProject(String(id), 'project:updated', {
        projectId: String(id),
        patch: { icon: updated?.icon ?? null },
      });
    } catch {
      /* noop */
    }

    return { projectId: String(id), patch: { icon: updated?.icon ?? null } };
  }
}

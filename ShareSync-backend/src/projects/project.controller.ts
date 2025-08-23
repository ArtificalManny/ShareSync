// src/projects/project.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projects: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
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
      members: Array.isArray(dto.members) ? dto.members : [],
      userId, // link to owner
    });

    return doc;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req) {
    const userId = req?.user?.sub;
    return this.projects.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.projects.findOneOwned(userId, id);
    if (!project) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return project;
  }

  // Minimal quick list used by the Home "Your Projects" rail
  // GET /api/projects/quick?limit=6
  @UseGuards(JwtAuthGuard)
  @Get('quick')
  async quick(@Req() req, @Query('limit') limit = '6') {
    const userId = req?.user?.sub;
    const n = Math.max(1, Math.min(12, parseInt(limit as string, 10) || 6));

    // Prefer a dedicated findMany if you have it; fall back to findAll + slice
    let items: any[] = [];
    try {
      // @ts-ignore if you have findMany, use it; else this will throw and we fallback
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
}

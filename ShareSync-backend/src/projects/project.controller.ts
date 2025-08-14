// src/projects/project.controller.ts
import {
  Body, Controller, Get, Param, Post, UseGuards, Req, HttpException, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
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

    // Require the same fields your UI uses
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
      userId, // <- link to owner
    });

    // Return the raw created document; frontend expects _id or id
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
}

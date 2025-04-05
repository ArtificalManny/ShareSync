import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('admin') admin: string,
    @Body('color') color: string,
    @Body('sharedWith') sharedWith: { userId: string; role: string }[],
  ): Promise<Project> {
    const projectData = { name, description, admin, color, sharedWith };
    const project = await this.projectsService.create(projectData);
    return project;
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string): Promise<Project> {
    return await this.projectsService.findById(id);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string): Promise<Project[]> {
    return await this.projectsService.findByUsername(username);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('color') color: string,
    @Body('sharedWith') sharedWith: { userId: string; role: string }[],
    @Body('status') status: string,
    @Body('likes') likes: number,
    @Body('comments') comments: number,
  ): Promise<Project> {
    const updates = { name, description, color, sharedWith, status, likes, comments };
    return await this.projectsService.update(id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return await this.projectsService.delete(id);
  }

  @Post('like/:id')
  async likeProject(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<Project> {
    return await this.projectsService.likeProject(id, userId);
  }
}
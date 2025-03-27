import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('by-id/:id')
  async findById(@Param('id') id: string): Promise<{ data: { project: Project } }> {
    const project = await this.projectsService.findById(id);
    if (!project) throw new Error('Project not found');
    return { data: { project } };
  }

  @Get(':admin')
  async findByAdmin(@Param('admin') admin: string): Promise<{ data: Project[] }> {
    const projects = await this.projectsService.findByAdmin(admin);
    return { data: projects };
  }

  @Post()
  async create(@Body() project: Partial<Project>): Promise<Project> {
    return this.projectsService.create(project);
  }
}
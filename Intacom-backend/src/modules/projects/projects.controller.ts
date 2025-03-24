import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() projectData: any) {
    const project = await this.projectsService.create(projectData);
    return { data: { project } };
  }

  @Get(':admin')
  async findByAdmin(@Param('admin') admin: string) {
    const projects = await this.projectsService.findByAdmin(admin);
    return { data: projects };
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);
    return { data: { project } };
  }
}
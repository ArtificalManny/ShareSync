import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() projectData: any) {
    return this.projectsService.create(projectData);
  }

  @Get(':admin')
  async findByAdmin(@Param('admin') admin: string) {
    return this.projectsService.findByAdmin(admin);
  }
}
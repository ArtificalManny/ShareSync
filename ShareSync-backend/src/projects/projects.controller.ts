import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '../schemas/project.schema'; // Corrected path

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: { title: string; description: string; ownerId: string }): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Get('public')
  async findPublic(): Promise<Project[]> {
    return this.projectsService.findPublic();
  }

  @Get('search')
  async search(@Query('query') query: string): Promise<Project[]> {
    return this.projectsService.search(query);
  }

  @Get('user/:username')
  async findAllByUsername(@Param('username') username: string): Promise<Project[]> {
    return this.projectsService.findAllByUsername(username);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: { title?: string; description?: string }): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return this.projectsService.remove(id);
  }
}
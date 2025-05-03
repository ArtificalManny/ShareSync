import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: any) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  async findAll() {
    return this.projectService.findAll();
  }

  @Get('search/:query')
  async search(@Param('query') query: string) {
    return this.projectService.findAll(); // Add search logic if needed
  }

  @Get('user/:username')
  async findByUser(@Param('username') username: string) {
    return this.projectService.findAll(); // Add user-specific logic if needed
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.projectService.delete(id);
  }
}
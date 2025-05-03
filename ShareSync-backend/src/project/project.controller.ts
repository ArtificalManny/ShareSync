import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: any) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  async findAll() {
    return this.projectService.findAll();
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

  @Post(':id/posts')
  async createPost(@Param('id') projectId: string, @Body() postData: any) {
    return this.projectService.createPost(projectId, postData);
  }
}
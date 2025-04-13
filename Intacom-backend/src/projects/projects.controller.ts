import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AppGateway } from '../app.gateway';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly appGateway: AppGateway
  ) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectsService.create(createProjectDto);
    this.appGateway.emitProjectCreated(project);
    return {
      status: 'success',
      message: 'Project created successfully',
      data: project,
    };
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const projects = await this.projectsService.findByUsername(username);
    return {
      status: 'success',
      data: projects,
    };
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);
    return {
      status: 'success',
      data: project,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    const project = await this.projectsService.update(id, updateProjectDto);
    return {
      status: 'success',
      message: 'Project updated successfully',
      data: project,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return {
      status: 'success',
      message: 'Project deleted successfully',
    };
  }
}
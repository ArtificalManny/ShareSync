import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '../../projects/schemas/project.schema';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: Partial<Project>): Promise<{ data: { project: Project } }> {
    const project = await this.projectsService.create(createProjectDto);
    return { data: { project } };
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string): Promise<{ data: Project[] }> {
    const projects = await this.projectsService.findByUsername(username);
    return { data: projects };
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string): Promise<{ data: { project: Project } }> {
    const project = await this.projectsService.findById(id);
    if (!project) throw new Error('Project not found');
    return { data: { project } };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: Partial<Project>): Promise<Project> {
    const updatedProject = await this.projectsService.update(id, updateProjectDto);
    if (!updatedProject) throw new Error('Project not found');
    return updatedProject;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.projectsService.delete(id);
  }
}
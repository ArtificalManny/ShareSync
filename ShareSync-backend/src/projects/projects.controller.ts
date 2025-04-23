import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '../schemas/project.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProject(@Body() createProjectDto: CreateProjectDto, @Request() req): Promise<Project> {
    console.log('Received project creation request:', createProjectDto, 'ownerId:', req.user.userId);
    const project = await this.projectsService.createProject(createProjectDto, req.user.userId);
    console.log('Project created:', project);
    return project;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProjects(@Request() req): Promise<Project[]> {
    return this.projectsService.getProjectsByUser(req.user.userId);
  }
}
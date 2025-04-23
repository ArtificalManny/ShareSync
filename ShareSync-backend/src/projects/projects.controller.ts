import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Post('announcement')
  async addAnnouncement(@Body() body: { projectId: string; message: string }, @Request() req) {
    const announcement = {
      message: body.message,
      timestamp: new Date(),
      postedBy: req.user.userId,
    };
    await this.projectsService.addAnnouncement(body.projectId, announcement);
    return { message: 'Announcement added' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('snapshot')
  async updateSnapshot(@Body() body: { projectId: string; snapshot: string }) {
    await this.projectsService.updateSnapshot(body.projectId, body.snapshot);
    return { message: 'Snapshot updated' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('status')
  async updateStatus(@Body() body: { projectId: string; status: string }) {
    await this.projectsService.updateStatus(body.projectId, body.status);
    return { message: 'Status updated' };
  }
}
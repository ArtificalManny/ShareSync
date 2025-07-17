import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    return this.projectService.create({
      ...createProjectDto,
      userId: req.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-projects')
  async getMyProjects(@Req() req) {
    return this.projectService.findAll(req.user.userId);
  }
}

import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Response } from 'express';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Res() res: Response,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('admin') admin: string,
    @Body('color') color?: string,
  ) {
    try {
      const project = await this.projectsService.createProject(name, description, admin, color);
      res.status(201).json({ project });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  @Get(':username')
  async getUserProjects(
    @Res() res: Response,
    @Param('username') username: string,
  ) {
    try {
      const projects = await this.projectsService.getUserProjects(username);
      res.status(200).json(projects);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  @Post(':projectId/addMember')
  async addMember(
    @Res() res: Response,
    @Param('projectId') projectId: string,
    @Body('username') username: string,
    @Body('role') role: 'member' | 'administrator',
  ) {
    try {
      const project = await this.projectsService.addMember(projectId, username, role);
      res.status(200).json({ project });
      // In production, send email notification to the user
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
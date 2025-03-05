import { Controller, Get, Post, Body, Param, Req, Res } from '@nestjs/common';
import { ProjectsService } from '../../../Intacom-frontend/projects.service';
import { Response, Request } from 'express';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async getProjects(@Res() res: Response) {
    try {
      const projects = await this.projectsService.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post()
  async createProject(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const newProject = await this.projectsService.createProject(body, user.username);
      res.json(newProject);
    } catch (error) {
      res.status(500).json({ error: 'Error creating project' });
    }
  }

  @Post(':projectId/share')
  async shareProject(@Param('projectId') projectId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.shareProject(projectId, user.username, body.users);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error sharing project' });
    }
  }

  @Post(':projectId/announcements')
  async addAnnouncement(@Param('projectId') projectId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.addAnnouncement(projectId, user.username, body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error adding announcement' });
    }
  }

  @Post(':projectId/tasks')
  async addTask(@Param('projectId') projectId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.addTask(projectId, user.username, body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error adding task' });
    }
  }

  @Post(':projectId/announcements/:annId/like')
  async likeAnnouncement(@Param('projectId') projectId: string, @Param('annId') annId: string, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.likeAnnouncement(projectId, parseInt(annId));
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error liking announcement' });
    }
  }

  @Post(':projectId/announcements/:annId/comments')
  async addAnnouncementComment(@Param('projectId') projectId: string, @Param('annId') annId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.addAnnouncementComment(projectId, parseInt(annId), user.username, body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error adding comment' });
    }
  }

  @Post(':projectId/tasks/:taskId/comments')
  async addTaskComment(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.addTaskComment(projectId, parseInt(taskId), user.username, body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error adding task comment' });
    }
  }

  @Post(':projectId/tasks/:taskId/status')
  async updateTaskStatus(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
      const project = await this.projectsService.updateTaskStatus(projectId, parseInt(taskId), user.username, body.status);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error updating task status' });
    }
  }
}
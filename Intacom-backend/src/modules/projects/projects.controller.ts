import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Post()
  async create(@Body() projectData: any) {
    const project = await this.projectsService.create(projectData);
    // Create a notification for the admin
    await this.notificationsService.create(
      projectData.admin,
      `New project "${projectData.name}" created`
    );
    // Create notifications for shared users
    if (projectData.sharedWith && projectData.sharedWith.length > 0) {
      for (const sharedUser of projectData.sharedWith) {
        await this.notificationsService.create(
          sharedUser.userId,
          `You have been added to the project "${projectData.name}" as ${sharedUser.role}`
        );
      }
    }
    return { data: { project } };
  }

  @Get(':admin')
  async findByAdmin(@Param('admin') admin: string) {
    const projects = await this.projectsService.findByAdmin(admin);
    return { data: projects };
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);
    return { data: { project } };
  }
}
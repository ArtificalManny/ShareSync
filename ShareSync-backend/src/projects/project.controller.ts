import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() projectData: any) {
    return this.projectService.create(projectData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.projectService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  createPost(@Param('id') projectId: string, @Body() postData: any) {
    return this.projectService.createPost(projectId, postData);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/posts')
  findPosts(@Param('id') projectId: string) {
    return this.projectService.findPosts(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/announcements')
  updateAnnouncement(@Param('id') projectId: string, @Body() announcement: any) {
    return this.projectService.updateAnnouncement(projectId, announcement);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/snapshot')
  updateSnapshot(@Param('id') projectId: string, @Body('snapshot') snapshot: string) {
    return this.projectService.updateSnapshot(projectId, snapshot);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks')
  createTask(@Param('id') projectId: string, @Body() task: any) {
    return this.projectService.createTask(projectId, task);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/tasks/:taskId/status')
  updateTaskStatus(
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body('status') status: string,
  ) {
    return this.projectService.updateTaskStatus(projectId, taskId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks/:taskId/comments')
  addComment(
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body() comment: any,
  ) {
    return this.projectService.addComment(projectId, taskId, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/:type/:itemId/like')
  likeItem(
    @Param('id') projectId: string,
    @Param('itemId') itemId: string,
    @Param('type') type: string,
    @Body('userId') userId: string,
  ) {
    return this.projectService.likeItem(projectId, itemId, type, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/:type/:itemId/share')
  shareItem(
    @Param('id') projectId: string,
    @Param('itemId') itemId: string,
    @Param('type') type: string,
    @Body('userId') userId: string,
  ) {
    return this.projectService.shareItem(projectId, itemId, type, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files')
  uploadFile(@Param('id') projectId: string, @Body() file: any) {
    return this.projectService.uploadFile(projectId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/files/:fileId/:status')
  approveFile(
    @Param('id') projectId: string,
    @Param('fileId') fileId: string,
    @Param('status') status: string,
  ) {
    return this.projectService.approveFile(projectId, fileId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/teams')
  createTeam(@Param('id') projectId: string, @Body() team: any) {
    return this.projectService.createTeam(projectId, team);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  inviteMember(@Param('id') projectId: string, @Body() invite: any) {
    return this.projectService.inviteMember(projectId, invite);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/notifications')
  updateNotificationSettings(@Param('id') projectId: string, @Body() settings: any) {
    return this.projectService.updateNotificationSettings(projectId, settings);
  }
}
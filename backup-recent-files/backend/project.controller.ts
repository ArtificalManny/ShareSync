import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProjectDto: any, @Request() req) {
    return this.projectService.create({ ...createProjectDto, userId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.projectService.findAll(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('metrics')
  getProjectMetrics(@Request() req) {
    return this.projectService.getProjectMetrics(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateProjectDto: any) {
    return this.projectService.update(id, req.user.sub, updateProjectDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  addPost(@Param('id') projectId: string, @Request() req, @Body() postData: any) {
    return this.projectService.addPost(projectId, req.user.sub, postData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts/:postId/comments')
  addPostComment(@Param('id') projectId: string, @Param('postId') postId: string, @Request() req, @Body() commentData: any) {
    return this.projectService.addPostComment(projectId, postId, req.user.sub, commentData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts/:postId/like')
  likePost(@Param('id') projectId: string, @Param('postId') postId: string, @Request() req) {
    return this.projectService.likePost(projectId, postId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks')
  addTask(@Param('id') projectId: string, @Request() req, @Body() taskData: any) {
    return this.projectService.addTask(projectId, req.user.sub, taskData);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/tasks/:taskId')
  updateTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Request() req, @Body() updateTaskDto: any) {
    return this.projectService.updateTask(projectId, taskId, req.user.sub, updateTaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks/:taskId/subtasks')
  addSubtask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Request() req, @Body() subtaskData: any) {
    return this.projectService.addSubtask(projectId, taskId, req.user.sub, subtaskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks/:taskId/comments')
  addTaskComment(@Param('id') projectId: string, @Param('taskId') taskId: string, @Request() req, @Body() commentData: any) {
    return this.projectService.addTaskComment(projectId, taskId, req.user.sub, commentData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks/:taskId/like')
  likeTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Request() req) {
    return this.projectService.likeTask(projectId, taskId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/teams')
  addTeam(@Param('id') projectId: string, @Request() req, @Body() teamData: any) {
    return this.projectService.addTeam(projectId, req.user.sub, teamData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files')
  addFile(@Param('id') projectId: string, @Request() req, @Body() fileData: any) {
    return this.projectService.addFile(projectId, req.user.sub, fileData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files/request')
  requestFile(@Param('id') projectId: string, @Request() req, @Body() fileData: any) {
    return this.projectService.requestFile(projectId, req.user.sub, fileData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  shareProject(@Param('id') projectId: string, @Request() req, @Body('userId') userId: string) {
    return this.projectService.shareProject(projectId, req.user.sub, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share/request')
  requestShare(@Param('id') projectId: string, @Request() req, @Body('userId') userId: string) {
    return this.projectService.requestShare(projectId, req.user.sub, userId);
  }
}
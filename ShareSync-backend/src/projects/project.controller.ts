import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createProjectDto: any) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Body('userId') userId: string) {
    return this.projectService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Post(':id/posts')
  @UseGuards(AuthGuard('jwt'))
  addPost(@Param('id') projectId: string, @Body() postData: any) {
    return this.projectService.addPost(projectId, postData);
  }

  @Post(':id/tasks')
  @UseGuards(AuthGuard('jwt'))
  addTask(@Param('id') projectId: string, @Body() taskData: any) {
    return this.projectService.addTask(projectId, taskData);
  }

  @Put(':id/tasks/:taskId')
  @UseGuards(AuthGuard('jwt'))
  updateTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Body() updateTaskDto: any) {
    return this.projectService.updateTask(projectId, taskId, updateTaskDto);
  }

  @Post(':id/teams')
  @UseGuards(AuthGuard('jwt'))
  addTeam(@Param('id') projectId: string, @Body() teamData: any) {
    return this.projectService.addTeam(projectId, teamData);
  }

  @Post(':id/files')
  @UseGuards(AuthGuard('jwt'))
  addFile(@Param('id') projectId: string, @Body() fileData: any) {
    return this.projectService.addFile(projectId, fileData);
  }

  @Post(':id/share')
  @UseGuards(AuthGuard('jwt'))
  shareProject(@Param('id') projectId: string, @Body('userId') userId: string) {
    return this.projectService.shareProject(projectId, userId);
  }
}
import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: any) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll(@Body('userId') userId: string) {
    return this.projectService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Post(':id/posts')
  addPost(@Param('id') projectId: string, @Body() postData: any) {
    return this.projectService.addPost(projectId, postData);
  }

  @Post(':id/tasks')
  addTask(@Param('id') projectId: string, @Body() taskData: any) {
    return this.projectService.addTask(projectId, taskData);
  }

  @Put(':id/tasks/:taskId')
  updateTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Body() updateTaskDto: any) {
    return this.projectService.updateTask(projectId, taskId, updateTaskDto);
  }

  @Post(':id/teams')
  addTeam(@Param('id') projectId: string, @Body() teamData: any) {
    return this.projectService.addTeam(projectId, teamData);
  }

  @Post(':id/files')
  addFile(@Param('id') projectId: string, @Body() fileData: any) {
    return this.projectService.addFile(projectId, fileData);
  }

  @Post(':id/share')
  shareProject(@Param('id') projectId: string, @Body('userId') userId: string) {
    return this.projectService.shareProject(projectId, userId);
  }
}
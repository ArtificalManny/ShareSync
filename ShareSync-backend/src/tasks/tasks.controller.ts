import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(
    @Body('projectId') projectId: string,
    @Body('title') title: string,
    @Body('description') description: string,
  ) {
    return this.tasksService.createTask(projectId, title, description);
  }

  @Get(':projectId')
  async getTasks(@Param('projectId') projectId: string) {
    return this.tasksService.getTasks(projectId);
  }

  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Body('status') status?: string,
    @Body('assignee') assignee?: string,
    @Body('dueDate') dueDate?: string,
  ) {
    return this.tasksService.updateTask(id, { status, assignee, dueDate: dueDate ? new Date(dueDate) : undefined });
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}
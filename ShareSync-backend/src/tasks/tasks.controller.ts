import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Request } from 'express';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(
    @Body() taskDto: { projectId: string; title: string; description: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.tasksService.createTask(taskDto.projectId, taskDto.title, taskDto.description, user.sub);
  }

  @Post(':id/complete')
  async completeTask(@Param('id') taskId: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.tasksService.completeTask(taskId, user.sub);
  }

  @Get('completed')
  async getCompletedTasks() {
    return this.tasksService.getCompletedTasks();
  }
}
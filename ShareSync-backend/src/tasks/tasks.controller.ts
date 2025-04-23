import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../schemas/task.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTask(@Body() taskData: Partial<Task>, @Request() req): Promise<Task> {
    return this.tasksService.createTask({
      ...taskData,
      assignedTo: req.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId')
  async getTasksByProject(@Param('projectId') projectId: string): Promise<Task[]> {
    return this.tasksService.getTasksByProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('assignedTo') assignedTo: string, // Fixed property name
    @Body('dueDate') dueDate?: string,
  ): Promise<Task> {
    return this.tasksService.updateTask(id, { status, assignedTo, dueDate: dueDate ? new Date(dueDate) : undefined });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTask(@Param('id') id: string): Promise<void> {
    return this.tasksService.deleteTask(id);
  }
}
import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../schemas/task.schema';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: { title: string; description?: string; projectId: string }): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get(':projectId')
  async findByProject(@Param('projectId') projectId: string): Promise<Task[]> {
    return this.tasksService.findByProject(projectId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: { status?: string; assignee?: string; dueDate?: string },
  ): Promise<Task> {
    const { status, assignee, dueDate } = updateTaskDto;
    return this.tasksService.updateTask(id, { status, assignee, dueDate: dueDate ? new Date(dueDate) : undefined });
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.tasksService.deleteTask(id);
  }
}
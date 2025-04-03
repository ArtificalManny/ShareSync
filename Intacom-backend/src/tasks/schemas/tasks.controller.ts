import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body('projectId') projectId: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('assignee') assignee: string,
    @Body('dueDate') dueDate: string,
  ) {
    try {
      return await this.tasksService.create(projectId, name, description, assignee, dueDate);
    } catch (error) {
      console.error('Error in create task:', error);
      throw error;
    }
  }

  @Get(':projectId')
  async findByProject(@Param('projectId') projectId: string) {
    try {
      return await this.tasksService.findByProject(projectId);
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<Task>) {
    try {
      return await this.tasksService.update(id, updates);
    } catch (error) {
      console.error('Error in update task:', error);
      throw error;
    }
  }
}
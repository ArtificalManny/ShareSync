import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('admin') admin: string,
    @Body('color') color: string,
    @Body('sharedWith') sharedWith: { userId: string; role: string }[],
  ) {
    try {
      return await this.projectsService.create(name, description, admin, color, sharedWith);
    } catch (error) {
      console.error('Error in create project:', error);
      throw error;
    }
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    try {
      return await this.projectsService.findByUsername(username);
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    try {
      return await this.projectsService.findById(id);
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<Project>) {
    try {
      return await this.projectsService.update(id, updates);
    } catch (error) {
      console.error('Error in update project:', error);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.projectsService.remove(id);
    } catch (error) {
      console.error('Error in remove project:', error);
      throw error;
    }
  }

  @Post('like/:id')
  async likeProject(@Param('id') id: string, @Body('userId') userId: string) {
    try {
      return await this.projectsService.likeProject(id, userId);
    } catch (error) {
      console.error('Error in likeProject:', error);
      throw error;
    }
  }
}
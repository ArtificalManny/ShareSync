import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: { name: string; description: string; sharedWith: string[]; creator: string }) {
    return this.projectsService.create(createProjectDto);
  }

  @Get('public')
  findPublic() {
    return this.projectsService.findPublic();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.projectsService.search(query);
  }

  @Get(':username')
  findAllByUsername(@Param('username') username: string) {
    return this.projectsService.findAllByUsername(username);
  }

  @Get('by-id/:id')
  findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: { name?: string; description?: string; isPublic?: boolean }) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
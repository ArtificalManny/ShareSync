import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IdeasService } from './ideas.service';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  async create(@Body() createIdeaDto: { title: string; description: string; userId: string }): Promise<any> {
    return this.ideasService.create(createIdeaDto);
  }

  @Get(':userId')
  async findByUser(@Param('userId') userId: string): Promise<any[]> {
    return this.ideasService.findByUser(userId);
  }
}
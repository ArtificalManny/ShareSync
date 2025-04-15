import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: { content: string; projectId: string; creatorId: string }) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.postsService.search(query);
  }
}
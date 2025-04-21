import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../schemas/post.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: { title: string; content: string; projectId: string; userId: string }): Promise<Post> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  async findAll(): Promise<Post[]> {
    return this.postsService.findAll();
  }

  @Get('search')
  async search(@Query('query') query: string): Promise<Post[]> {
    return this.postsService.search(query);
  }
}
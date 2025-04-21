import { Controller, Post as PostDecorator, Get, Body, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostModel } from '../schemas/post.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @PostDecorator()
  async create(@Body() createPostDto: { title: string; content: string; projectId: string; userId: string }): Promise<PostModel> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  async findAll(): Promise<PostModel[]> {
    return this.postsService.findAll();
  }

  @Get('search')
  async search(@Query('query') query: string): Promise<PostModel[]> {
    return this.postsService.search(query);
  }
}
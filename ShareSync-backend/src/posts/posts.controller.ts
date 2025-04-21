import { Controller, Post as PostDecorator, Get, Body, Query } from '@nestjs/common';
import { Post as PostSchema } from '../schemas/post.schema'; // Renamed to avoid conflict

@Controller('posts')
export class PostsController {
  // Use PostDecorator for the NestJS decorator
  @PostDecorator()
  async create(
    @Body() createPostDto: { title: string; content: string; projectId: string; userId: string }
  ): Promise<PostSchema> {
    // ...existing code...
  }

  @Get()
  async findAll(): Promise<PostSchema[]> {
    // ...existing code...
  }

  @Get('search')
  async search(@Query('query') query: string): Promise<PostSchema[]> {
    // ...existing code...
  }
}
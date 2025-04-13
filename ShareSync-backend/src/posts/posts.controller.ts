import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AppGateway } from '../app.gateway';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly appGateway: AppGateway
  ) {}

  @Post()
  async create(@Body() post: { content: string; projectId: string; userId: string }) {
    const createdPost = await this.postsService.create(post);
    this.appGateway.emitPostCreated(createdPost);
    return {
      status: 'success',
      message: 'Post created successfully',
      data: createdPost,
    };
  }

  @Get(':projectId')
  async findByProjectId(@Param('projectId') projectId: string) {
    const posts = await this.postsService.findByProject(projectId);
    return {
      status: 'success',
      data: posts,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<{ content: string }>) {
    return await this.postsService.update(id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.postsService.delete(id);
  }

  @Post('like/:id')
  async like(@Param('id') id: string, @Body('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }
    return await this.postsService.like(id, userId);
  }
}
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(
    @Body('projectId') projectId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
    @Body('images') images: string[],
  ) {
    try {
      return await this.postsService.create(projectId, userId, content, images);
    } catch (error) {
      console.error('Error in create post:', error);
      throw error;
    }
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    try {
      return await this.postsService.findByProject(projectId);
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<Post>) {
    try {
      return await this.postsService.update(id, updates);
    } catch (error) {
      console.error('Error in update post:', error);
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.postsService.delete(id);
    } catch (error) {
      console.error('Error in delete post:', error);
      throw error;
    }
  }

  @Post('like/:id')
  async likePost(@Param('id') id: string, @Body('userId') userId: string) {
    try {
      return await this.postsService.likePost(id, userId);
    } catch (error) {
      console.error('Error in likePost:', error);
      throw error;
    }
  }
}
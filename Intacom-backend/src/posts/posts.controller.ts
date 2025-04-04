import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostInterface } from '../posts/types/post.interface';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: { projectId: string; userId: string; content: string; images: string[] }) {
    try {
      return await this.postsService.create(createPostDto);
    } catch (error) {
      console.error('Error in create post:', error);
      throw error;
    }
  }

  @Get('project/:projectId')
  async findByProjectId(@Param('projectId') projectId: string) {
    try {
      const posts = await this.postsService.findByProjectId(projectId);
      return { data: posts };
    } catch (error) {
      console.error('Error in findByProjectId:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<PostInterface>) {
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
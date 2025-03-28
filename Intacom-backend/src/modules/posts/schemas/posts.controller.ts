import { Controller, Get, Post as HttpPost, Put, Delete, Body, Param } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostModel } from './schemas/post.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  async create(@Body() createPostDto: Partial<PostModel>): Promise<PostModel> {
    return this.postsService.create(createPostDto);
  }

  @Get('project/:projectId')
  async findByProjectId(@Param('projectId') projectId: string): Promise<PostModel[]> {
    return this.postsService.findByProjectId(projectId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: Partial<PostModel>): Promise<PostModel> {
    const updatedPost = await this.postsService.update(id, updatePostDto);
    if (!updatedPost) throw new Error('Post not found');
    return updatedPost;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.postsService.delete(id);
  }
}
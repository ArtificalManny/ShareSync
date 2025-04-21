import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from '../schemas/comment.schema';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Body() commentData: { userId: string; projectId: string; content: string }): Promise<Comment> {
    return this.commentsService.create(commentData);
  }

  @Get(':projectId')
  async findByProject(@Param('projectId') projectId: string): Promise<Comment[]> {
    return this.commentsService.findByProject(projectId);
  }
}
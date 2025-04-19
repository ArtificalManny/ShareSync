import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';

@Controller('comments')
export class CommentsController {
  constructor(@InjectModel('Comment') private commentModel: Model<Comment>) {}

  @Post()
  async createComment(
    @Body('postId') postId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    const comment = new this.commentModel({ postId, userId, content });
    return comment.save();
  }

  @Get(':postId')
  async getComments(@Param('postId') postId: string) {
    return this.commentModel.find({ postId }).exec();
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string) {
    return this.commentModel.findByIdAndDelete(id).exec();
  }
}
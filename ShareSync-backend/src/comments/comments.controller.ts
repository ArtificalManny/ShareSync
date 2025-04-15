import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(createCommentDto: { content: string; postId: string; creatorId: string }) {
    const comment = new this.commentModel({
      content: createCommentDto.content,
      post: createCommentDto.postId,
      creator: createCommentDto.creatorId,
      createdAt: new Date(),
    });
    return comment.save();
  }

  async findByPostId(postId: string) {
    return this.commentModel.find({ post: postId }).populate('creator').exec();
  }
}
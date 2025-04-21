import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(@InjectModel('Comment') private readonly commentModel: Model<Comment>) {}

  async create(commentData: { userId: string; projectId: string; content: string }): Promise<Comment> {
    const comment = new this.commentModel({ ...commentData, createdAt: new Date() });
    return comment.save();
  }

  async findByProject(projectId: string): Promise<Comment[]> {
    return this.commentModel.find({ projectId }).exec();
  }
}
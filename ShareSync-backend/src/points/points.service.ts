import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';

@Injectable()
export class PointsService {
  constructor(@InjectModel('Post') private readonly postModel: Model<Post>) {}

  async create(postData: { title: string; content: string }): Promise<Post> {
    const post = new this.postModel(postData);
    return post.save();
  }
}
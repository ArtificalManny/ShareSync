import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(post: Partial<Post>): Promise<Post> {
    const newPost = new this.postModel(post);
    return newPost.save();
  }

  async findByProjectId(projectId: string): Promise<Post[]> {
    return this.postModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updatePostDto: Partial<Post>): Promise<Post | null> {
    return this.postModel.findByIdAndUpdate(id, updatePostDto, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.postModel.findByIdAndDelete(id).exec();
  }
}
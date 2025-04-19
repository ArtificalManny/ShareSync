import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private postModel: Model<Post>,
    private notificationsService: NotificationsService,
  ) {}

  async createPost(content: string, creator: string, projectId: string): Promise<Post> {
    const post = new this.postModel({ content, creator, projectId });
    const savedPost = await post.save();

    // Notify project members
    await this.notificationsService.createNotification(
      projectId,
      creator,
      `${creator} created a new post`,
    );

    return savedPost;
  }

  async getPosts(projectId: string): Promise<Post[]> {
    return this.postModel.find({ projectId }).populate('creator').exec();
  }
}
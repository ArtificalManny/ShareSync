import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private notificationsService: NotificationsService,
    private pointsService: PointsService,
  ) {}

  async create(projectId: string, userId: string, content: string, images: string[]) {
    try {
      const post = new this.postModel({
        projectId,
        userId,
        content,
        images,
      });
      const savedPost = await post.save();

      // Notify project collaborators
      const project = await this.projectModel.findById(projectId).exec();
      for (const collaborator of project.sharedWith) {
        await this.notificationsService.create(
          collaborator.userId,
          'new_post',
          `A new post was added to ${project.name}!`,
          savedPost._id.toString(),
        );
      }

      // Award points to the user for posting
      await this.pointsService.addPoints(userId, 5, 'create_post');

      return savedPost;
    } catch (error) {
      console.error('Error in create post:', error);
      throw new BadRequestException('Failed to create post');
    }
  }

  async findByProject(projectId: string) {
    try {
      return await this.postModel.find({ projectId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Post>) {
    try {
      const updatedPost = await this.postModel
        .findByIdAndUpdate(id, updates, { new: true })
        .exec();
      if (!updatedPost) {
        throw new NotFoundException('Post not found');
      }
      return updatedPost;
    } catch (error) {
      console.error('Error in update post:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const post = await this.postModel.findByIdAndDelete(id).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error('Error in delete post:', error);
      throw error;
    }
  }

  async likePost(id: string, userId: string) {
    try {
      const post = await this.postModel.findById(id).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (!post.likedBy.includes(userId)) {
        post.likes += 1;
        post.likedBy.push(userId);
        await post.save();

        // Notify the post author
        await this.notificationsService.create(
          post.userId,
          'post_like',
          `Your post received a like!`,
          post._id.toString(),
        );

        // Award points to the user for liking
        await this.pointsService.addPoints(userId, 1, 'like_post');
      }

      return { message: 'Post liked successfully' };
    } catch (error) {
      console.error('Error in likePost:', error);
      throw error;
    }
  }
}
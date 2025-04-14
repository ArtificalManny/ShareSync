import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>
  ) {}

  async create(post: { content: string; projectId: string; userId: string }): Promise<PostDocument> {
    const createdPost = new this.postModel(post);
    return createdPost.save();
  }

  async findByProject(projectId: string): Promise<PostDocument[]> {
    return this.postModel.find({ projectId }).exec();
  }

  async like(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);

      // Create a notification
      const project = await this.projectModel.findById(post.projectId).exec();
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

      for (const collaborator of project.sharedWith) {
        if (collaborator !== userId) {
          // In a real app, you'd inject a NotificationsService here
          // For simplicity, we'll log the action
          console.log(`Notification: User ${userId} liked a post in project ${project.name} for collaborator ${collaborator}`);
        }
      }
    }
    await post.save();
    return post;
  }
}
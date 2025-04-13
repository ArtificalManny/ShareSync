import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(post: { content: string; projectId: string; userId: string }): Promise<PostDocument> {
    const createdPost = new this.postModel(post);
    const project = await this.projectModel.findById(post.projectId).exec();
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    // Notify collaborators
    for (const collaborator of project.sharedWith) {
      if (collaborator !== post.userId) {
        await this.notificationsService.create({
          userId: collaborator,
          content: `New post in project ${project.name} by user ${post.userId}`,
        });
      }
    }

    return createdPost.save();
  }

  async findByProject(projectId: string): Promise<PostDocument[]> {
    return this.postModel.find({ projectId }).exec();
  }

  async update(id: string, updates: Partial<Post>): Promise<PostDocument> {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!updatedPost) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return updatedPost;
  }

  async delete(id: string): Promise<void> {
    const result = await this.postModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
  }

  async like(id: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);

      const project = await this.projectModel.findById(post.projectId).exec();
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

      for (const collaborator of project.sharedWith) {
        if (collaborator !== userId) {
          await this.notificationsService.create({
            userId: collaborator,
            content: `User ${userId} liked a post in project ${project.name}`,
          });
        }
      }
    }
    await post.save();
    return post;
  }
}
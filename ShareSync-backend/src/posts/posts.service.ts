import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from '../schemas/post.schema'; // Corrected path
import { ProjectsService } from '../project/projects.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createPostDto: { title: string; content: string; projectId: string; userId: string }): Promise<Post> {
    const project = await this.projectsService.findById(createPostDto.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const post = new this.postModel(createPostDto);
    const savedPost = await post.save();

    await this.notificationsService.createNotification(
      createPostDto.projectId,
      createPostDto.userId,
      `New post created: ${createPostDto.title}`,
    );

    return savedPost;
  }

  async findAll(): Promise<Post[]> {
    return this.postModel.find().exec();
  }

  async search(query: string): Promise<Post[]> {
    return this.postModel.find({ title: new RegExp(query, 'i') }).exec();
  }
}
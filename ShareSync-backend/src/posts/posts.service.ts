import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private projectsService: ProjectsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPostDto: { content: string; projectId: string; creatorId: string }) {
    const post = new this.postModel({
      ...createPostDto,
      createdAt: new Date(),
    });
    await post.save();

    const project = await this.projectsService.findById(createPostDto.projectId);
    const creator = project.creator as any;
    const members = [creator.email, ...project.sharedWith];
    for (const email of members) {
      if (email !== creator.email) {
        await this.notificationsService.createNotification(
          email,
          `New post in project ${project.name}: "${createPostDto.content}"`,
        );
      }
    }

    return post;
  }

  async findAll() {
    return this.postModel.find().populate('creator project').exec();
  }

  async search(query: string) {
    const regex = new RegExp(query, 'i');
    return this.postModel
      .find({
        $or: [
          { content: regex },
          { 'creator.username': regex },
          { 'project.name': regex },
        ],
      })
      .populate('creator project')
      .exec();
  }
}
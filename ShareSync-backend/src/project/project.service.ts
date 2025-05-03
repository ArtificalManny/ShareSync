import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { NotificationService } from '../notification/notification.service';
import { TeamActivityService } from '../teamActivity/teamActivity.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly notificationService: NotificationService,
    private readonly teamActivityService: TeamActivityService,
  ) {}

  async create(createProjectDto: any): Promise<Project> {
    const project = new this.projectModel(createProjectDto);
    const savedProject = await project.save();
    
    if (createProjectDto.userId) {
      await this.notificationService.create(createProjectDto.userId, `New project created: ${createProjectDto.title}`);
      await this.teamActivityService.create(createProjectDto.userId, `Created project: ${createProjectDto.title}`);
    }

    return savedProject;
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: any): Promise<Project> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new Error('Project not found');

    Object.assign(project, updateProjectDto);
    const updatedProject = await project.save();

    if (updateProjectDto.userId) {
      if (updateProjectDto.announcement) {
        await this.notificationService.create(updateProjectDto.userId, `New announcement in ${project.title}: ${updateProjectDto.announcement}`);
        await this.teamActivityService.create(updateProjectDto.userId, `Posted announcement in ${project.title}: ${updateProjectDto.announcement}`);
      }
      if (updateProjectDto.snapshot) {
        await this.notificationService.create(updateProjectDto.userId, `New snapshot added to ${project.title}`);
        await this.teamActivityService.create(updateProjectDto.userId, `Added snapshot to ${project.title}`);
      }
    }

    return updatedProject;
  }

  async delete(id: string): Promise<void> {
    await this.projectModel.findByIdAndDelete(id).exec();
  }

  async createPost(projectId: string, postData: any): Promise<Project> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new Error('Project not found');
    project.posts.push(postData);
    const updatedProject = await project.save();

    if (postData.userId) {
      await this.notificationService.create(postData.userId, `New post in ${project.title}: ${postData.title}`);
      await this.teamActivityService.create(postData.userId, `Posted in ${project.title}: ${postData.title}`);
    }

    return updatedProject;
  }
}
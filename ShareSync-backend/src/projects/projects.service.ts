import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel('Project') private projectModel: Model<Project>) {}

  async createProject(name: string, description: string, creator: string): Promise<Project> {
    const project = new this.projectModel({ name, description, creator, members: [creator] });
    return project.save();
  }

  async getProjects(userId: string): Promise<Project[]> {
    return this.projectModel.find({ members: userId }).exec();
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.projectModel.findById(projectId).exec();
  }

  async addMember(projectId: string, userId: string): Promise<void> {
    await this.projectModel.updateOne(
      { _id: projectId },
      { $addToSet: { members: userId } },
    ).exec();
  }
}
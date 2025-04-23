import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async createProject(createProjectDto: CreateProjectDto, ownerId: string): Promise<Project> {
    const createdProject = new this.projectModel({ ...createProjectDto, ownerId, teamActivities: [] });
    return createdProject.save();
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return this.projectModel.find({ ownerId: userId }).exec();
  }

  async findById(projectId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return project;
  }

  async addTeamActivity(projectId: string, activity: { type: string; message: string; timestamp: Date }): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    if (!project.teamActivities) {
      project.teamActivities = [];
    }
    project.teamActivities.push(activity);
    await project.save();
  }
}
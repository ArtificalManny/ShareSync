import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>) {}

  async create(createProjectDto: { title: string; description: string; ownerId: string }): Promise<Project> {
    const project = new this.projectModel(createProjectDto);
    return project.save();
  }

  async findPublic(): Promise<Project[]> {
    return this.projectModel.find({ isPublic: true }).exec();
  }

  async search(query: string): Promise<Project[]> {
    return this.projectModel.find({ title: new RegExp(query, 'i') }).exec();
  }

  async findAllByUsername(username: string): Promise<Project[]> {
    return this.projectModel.find({ ownerId: username }).exec();
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: { title?: string; description?: string }): Promise<Project | null> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async remove(id: string): Promise<any> {
    return this.projectModel.findByIdAndDelete(id).exec();
  }

  async addTeamActivity(projectId: string, activity: string): Promise<void> {
    // Placeholder for adding team activity
    // In a real app, this would update the project with activity logs
    console.log(`Adding team activity to project ${projectId}: ${activity}`);
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(projectData: Partial<Project>): Promise<Project> {
    const newProject = new this.projectModel({
      ...projectData,
      status: projectData.status || 'current',
      sharedWith: projectData.sharedWith || [],
    });
    const savedProject = await newProject.save();
    return savedProject;
  }

  async findByUsername(username: string): Promise<Project[]> {
    return this.projectModel.find({ admin: username }).exec();
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(id, projectData, { new: true }).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async delete(id: string): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectModel.findByIdAndDelete(id).exec();
  }
}
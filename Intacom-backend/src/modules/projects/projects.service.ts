import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './project.model';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>) {}

  async create(projectData: any): Promise<Project> {
    const newProject = new this.projectModel(projectData);
    return await newProject.save();
  }

  async findByAdmin(admin: string): Promise<Project[]> {
    return await this.projectModel.find({ admin }).exec();
  }

  async findById(id: string): Promise<Project> {
    return await this.projectModel.findById(id).exec();
  }
}
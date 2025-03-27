import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../modules/projects/schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async findById(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async findByAdmin(admin: string): Promise<Project[]> {
    return this.projectModel.find({ admin }).exec();
  }

  async create(project: Partial<Project>): Promise<Project> {
    const newProject = new this.projectModel(project);
    return newProject.save();
  }
}
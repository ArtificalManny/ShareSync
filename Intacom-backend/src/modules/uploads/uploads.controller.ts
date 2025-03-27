import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    const newProject = new this.projectModel(createProjectDto);
    return newProject.save();
  }

  async findByUsername(username: string): Promise<Project[]> {
    return this.projectModel.find({
      $or: [
        { admin: username },
        { 'sharedWith.userId': username },
      ],
    }).exec();
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: Partial<Project>): Promise<Project | null> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.projectModel.findByIdAndDelete(id).exec();
  }
}
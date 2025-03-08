import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../models/project.model';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel('Project') private projectModel: Model<Project>) {}

  async createProject(name: string, description: string, admin: string, color?: string): Promise<Project> {
    const project = new this.projectModel({
      name,
      description,
      admin,
      color,
      administrators: [admin],
      members: [admin],
    });
    return project.save();
  }

  async getUserProjects(username: string): Promise<Project[]> {
    return this.projectModel.find({ $or: [{ members: username }, { administrators: username }] }).exec();
  }

  async addMember(projectId: string, username: string, role: 'member' | 'administrator'): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');

    if (role === 'member' && !project.members.includes(username)) {
      project.members.push(username);
    } else if (role === 'administrator' && !project.administrators.includes(username)) {
      project.administrators.push(username);
    }
    return project.save();
  }
}
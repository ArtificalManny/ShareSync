import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(projectData: Partial<Project>): Promise<Project> {
    try {
      const newProject = new this.projectModel(projectData);
      const savedProject = await newProject.save();
      return savedProject.toObject(); // Convert to plain object
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Project> {
    try {
      const project = await this.projectModel
        .findById(id)
        .lean()
        .exec();
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      return project;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<Project[]> {
    try {
      return await this.projectModel
        .find({ $or: [{ admin: username }, { 'sharedWith.userId': username }] })
        .lean()
        .exec();
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const updatedProject = await this.projectModel
        .findByIdAndUpdate(id, updates, { new: true })
        .lean()
        .exec();
      if (!updatedProject) {
        throw new NotFoundException('Project not found');
      }
      return updatedProject;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.projectModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Project not found');
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}
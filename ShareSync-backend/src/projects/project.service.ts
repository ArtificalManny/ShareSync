import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schemas';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: any): Promise<ProjectDocument> {
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ userId }).exec();
  }

  async findOne(id: string): Promise<ProjectDocument> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (updateProjectDto.announcement) {
      project.announcement = updateProjectDto.announcement;
    }
    if (updateProjectDto.snapshot) {
      project.snapshot = updateProjectDto.snapshot;
    }
    if (updateProjectDto.status) {
      project.status = updateProjectDto.status;
    }
    return project.save();
  }

  async addPost(projectId: string, postData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    project.posts.push({ ...postData, createdAt: new Date() });
    return project.save();
  }

  async addTask(projectId: string, taskData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    project.tasks.push(taskData);
    return project.save();
  }

  async updateTask(projectId: string, taskId: string, updateTaskDto: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const task = project.tasks.find(t => t._id.toString() === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    Object.assign(task, updateTaskDto);
    if (updateTaskDto.status === 'Completed') {
      project.tasksCompleted = (project.tasksCompleted || 0) + 1;
    }
    return project.save();
  }

  async addTeam(projectId: string, teamData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    project.teams.push(teamData);
    return project.save();
  }

  async addFile(projectId: string, fileData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    project.files.push({ ...fileData, createdAt: new Date() });
    return project.save();
  }

  async shareProject(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.sharedWith.includes(userId)) {
      project.sharedWith.push(userId);
    }
    return project.save();
  }
}
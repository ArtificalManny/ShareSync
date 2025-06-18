import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: any): Promise<ProjectDocument> {
    const createdProject = new this.projectModel({
      ...createProjectDto,
      userId: createProjectDto.userId || 'defaultUserId',
      members: createProjectDto.members ? JSON.parse(createProjectDto.members) : [],
    });
    return await createdProject.save();
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ userId }).exec();
  }

  async findOne(id: string): Promise<ProjectDocument> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: any): Promise<ProjectDocument> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async addPost(projectId: string, postData: any): Promise<any> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { posts: postData } },
      { new: true }
    ).exec();
  }

  async addTask(projectId: string, taskData: any): Promise<any> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { tasks: taskData } },
      { new: true }
    ).exec();
  }

  async updateTask(projectId: string, taskId: string, updateTaskDto: any): Promise<any> {
    return this.projectModel.findOneAndUpdate(
      { _id: projectId, 'tasks._id': taskId },
      { $set: { 'tasks.$': updateTaskDto } },
      { new: true }
    ).exec();
  }

  async addTeam(projectId: string, teamData: any): Promise<any> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { teams: teamData } },
      { new: true }
    ).exec();
  }

  async addFile(projectId: string, fileData: any): Promise<any> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { files: fileData } },
      { new: true }
    ).exec();
  }

  async shareProject(projectId: string, userId: string): Promise<any> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { sharedWith: userId } },
      { new: true }
    ).exec();
  }
}
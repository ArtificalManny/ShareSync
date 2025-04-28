import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../schemas/project.schema';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async create(projectData: any): Promise<Project> {
    const project = new this.projectModel(projectData);
    return project.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }

  async findOne(id: string): Promise<Project> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateData: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async createPost(projectId: string, postData: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { posts: postData } },
      { new: true },
    ).exec();
  }

  async findPosts(projectId: string): Promise<any[]> {
    const project = await this.projectModel.findById(projectId).exec();
    return project.posts || [];
  }

  async updateAnnouncement(projectId: string, announcement: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { announcements: announcement } },
      { new: true },
    ).exec();
  }

  async updateSnapshot(projectId: string, snapshot: string): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { snapshot },
      { new: true },
    ).exec();
  }

  async createTask(projectId: string, task: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { tasks: task } },
      { new: true },
    ).exec();
  }

  async updateTaskStatus(projectId: string, taskId: string, status: string): Promise<Project> {
    return this.projectModel.findOneAndUpdate(
      { _id: projectId, 'tasks._id': taskId },
      { $set: { 'tasks.$.status': status } },
      { new: true },
    ).exec();
  }

  async addComment(projectId: string, taskId: string, comment: any): Promise<Project> {
    return this.projectModel.findOneAndUpdate(
      { _id: projectId, 'tasks._id': taskId },
      { $push: { 'tasks.$.comments': comment } },
      { new: true },
    ).exec();
  }

  async likeItem(projectId: string, itemId: string, type: string, userId: string): Promise<Project> {
    const update = type === 'tasks'
      ? { $addToSet: { 'tasks.$[task].likes': userId } }
      : type === 'announcements'
      ? { $addToSet: { 'announcements.$[ann].likes': userId } }
      : { $addToSet: { 'files.$[file].likes': userId } };
    const arrayFilters = type === 'tasks'
      ? [{ 'task._id': itemId }]
      : type === 'announcements'
      ? [{ 'ann._id': itemId }]
      : [{ 'file._id': itemId }];
    return this.projectModel.findByIdAndUpdate(
      projectId,
      update,
      { new: true, arrayFilters },
    ).exec();
  }

  async shareItem(projectId: string, itemId: string, type: string, userId: string): Promise<Project> {
    const update = type === 'tasks'
      ? { $addToSet: { 'tasks.$[task].shares': userId } }
      : type === 'announcements'
      ? { $addToSet: { 'announcements.$[ann].shares': userId } }
      : { $addToSet: { 'files.$[file].shares': userId } };
    const arrayFilters = type === 'tasks'
      ? [{ 'task._id': itemId }]
      : type === 'announcements'
      ? [{ 'ann._id': itemId }]
      : [{ 'file._id': itemId }];
    return this.projectModel.findByIdAndUpdate(
      projectId,
      update,
      { new: true, arrayFilters },
    ).exec();
  }

  async uploadFile(projectId: string, file: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { files: file } },
      { new: true },
    ).exec();
  }

  async approveFile(projectId: string, fileId: string, status: string): Promise<Project> {
    return this.projectModel.findOneAndUpdate(
      { _id: projectId, 'files._id': fileId },
      { $set: { 'files.$.status': status === 'approve' ? 'Approved' : 'Rejected' } },
      { new: true },
    ).exec();
  }

  async createTeam(projectId: string, team: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { teams: team } },
      { new: true },
    ).exec();
  }

  async inviteMember(projectId: string, invite: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { members: { user: invite.email, role: invite.role } } },
      { new: true },
    ).exec();
  }

  async updateNotificationSettings(projectId: string, settings: any): Promise<Project> {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { notificationSettings: settings },
      { new: true },
    ).exec();
  }
}
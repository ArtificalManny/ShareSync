import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../../models/project.model';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async getProjects() {
    return this.projectModel.find();
  }

  async createProject(body: any, admin: string) {
    const newProject = new this.projectModel({
      ...body,
      id: Date.now(),
      admin,
      sharedWith: [],
    });
    return newProject.save();
  }

  async shareProject(projectId: string, username: string, users: string[]) {
    const project = await this.projectModel.findById(projectId);
    if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
      throw new Error('Unauthorized');
    }
    project.sharedWith = [...new Set([...project.sharedWith, ...users])];
    return project.save();
  }

  async addAnnouncement(projectId: string, username: string, body: any) {
    const project = await this.projectModel.findById(projectId);
    if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
      throw new Error('Unauthorized');
    }
    project.announcements.push({ ...body, id: Date.now(), likes: 0, comments: [], user: username });
    await project.save();
    return project;
  }

  async addTask(projectId: string, username: string, body: any) {
    const project = await this.projectModel.findById(projectId);
    if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
      throw new Error('Unauthorized');
    }
    project.tasks.push({ ...body, id: Date.now(), comments: [], user: username });
    await project.save();
    return project;
  }

  async likeAnnouncement(projectId: string, annId: number) {
    const project = await this.projectModel.findById(projectId);
    const announcement = project.announcements.find(a => a.id === annId);
    if (announcement) announcement.likes += 1;
    await project.save();
    return project;
  }

  async addAnnouncementComment(projectId: string, annId: number, username: string, body: any) {
    const project = await this.projectModel.findById(projectId);
    const announcement = project.announcements.find(a => a.id === annId);
    if (announcement) announcement.comments.push({ ...body, user: username });
    await project.save();
    return project;
  }

  async addTaskComment(projectId: string, taskId: number, username: string, body: any) {
    const project = await this.projectModel.findById(projectId);
    const task = project.tasks.find(t => t.id === taskId);
    if (task) task.comments.push({ ...body, user: username });
    await project.save();
    return project;
  }

  async updateTaskStatus(projectId: string, taskId: number, username: string, status: string) {
    const project = await this.projectModel.findById(projectId);
    const task = project.tasks.find(t => t.id === taskId);
    if (task && (username === task.assignee || username === project.admin)) {
      task.status = status;
      await project.save();
      return project;
    } else {
      throw new Error('Unauthorized to update task status');
    }
  }
}
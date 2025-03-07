import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../models/project.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async createProject(name: string, description: string, admin: string, sharedWith: string[] = [], announcements: any[] = [], tasks: any[] = []): Promise<Project> {
    const project = new this.projectModel({ name, description, admin, sharedWith, announcements, tasks });
    return project.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async shareProject(projectId: string, users: string[], admin: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project || project.admin !== admin) {
      throw new Error('Unauthorized or project not found');
    }
    project.sharedWith = [...new Set([...project.sharedWith, ...users])];
    return project.save();
  }

  async addAnnouncement(projectId: string, content: string, media: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    project.announcements.push({ id: uuidv4(), content, media, user, likes: 0, comments: [] });
    return project.save();
  }

  async addTask(projectId: string, title: string, assignee: string, dueDate: Date, status: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    project.tasks.push({ id: uuidv4(), title, assignee, dueDate, status, user, comments: [] });
    return project.save();
  }

  async likeAnnouncement(projectId: string, annId: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    const announcement = project.announcements.find(a => a.id === annId);
    if (!announcement) throw new Error('Announcement not found');
    announcement.likes = (announcement.likes || 0) + 1;
    return project.save();
  }

  async addAnnouncementComment(projectId: string, annId: string, text: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    const announcement = project.announcements.find(a => a.id === annId);
    if (!announcement) throw new Error('Announcement not found');
    announcement.comments.push({ user, text });
    return project.save();
  }

  async addTaskComment(projectId: string, taskId: string, text: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.comments.push({ user, text });
    return project.save();
  }

  async updateTaskStatus(projectId: string, taskId: string, status: string, user: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new Error('Project not found');
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.status = status;
    return project.save();
  }
}
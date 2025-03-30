import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { Project, ProjectDocument } from './project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(projectData: Partial<Project>): Promise<Project> {
    const newProject = new this.projectModel(projectData);
    const savedProject = await newProject.save();
    const cacheKey = `projects:${savedProject.admin}`;
    await this.cacheManager.del(cacheKey); // Invalidate cache
    return savedProject;
  }

  async findByUsername(username: string): Promise<Project[]> {
    const cacheKey = `projects:${username}`;
    const cachedProjects = await this.cacheManager.get<Project[]>(cacheKey);

    if (cachedProjects) {
      return cachedProjects;
    }

    const projects = await this.projectModel.find({ admin: username }).exec();
    await this.cacheManager.set(cacheKey, projects, { ttl: 300 });
    return projects;
  }

  async findById(id: string): Promise<Project> {
    const cacheKey = `project:${id}`;
    const cachedProject = await this.cacheManager.get<Project>(cacheKey);

    if (cachedProject) {
      return cachedProject;
    }

    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.cacheManager.set(cacheKey, project, { ttl: 300 });
    return project;
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(id, projectData, { new: true }).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const cacheKey = `project:${id}`;
    const adminCacheKey = `projects:${project.admin}`;
    await this.cacheManager.set(cacheKey, project, { ttl: 300 });
    await this.cacheManager.del(adminCacheKey); // Invalidate admin's project list cache
    return project;
  }

  async delete(id: string): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectModel.findByIdAndDelete(id).exec();
    const cacheKey = `project:${id}`;
    const adminCacheKey = `projects:${project.admin}`;
    await this.cacheManager.del(cacheKey);
    await this.cacheManager.del(adminCacheKey);
  }
}
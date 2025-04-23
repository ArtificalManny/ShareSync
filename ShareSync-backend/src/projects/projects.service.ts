import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly usersService: UsersService,
  ) {}

  async createProject(createProjectDto: CreateProjectDto, ownerId: string): Promise<Project> {
    const createdProject = new this.projectModel({
      ...createProjectDto,
      ownerId,
      members: [ownerId],
      teamActivities: [],
      announcements: [],
      status: 'In Progress',
    });
    const project = await createdProject.save();
    await this.usersService.addProject(ownerId, project._id.toString());
    return project;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return this.projectModel.find({ members: userId }).exec();
  }

  async findById(projectId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return project;
  }

  async addTeamActivity(projectId: string, activity: { type: string; message: string; timestamp: Date }): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    if (!project.teamActivities) {
      project.teamActivities = [];
    }
    project.teamActivities.push(activity);
    await project.save();
  }

  async addAnnouncement(projectId: string, announcement: { message: string; timestamp: Date; postedBy: string }): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    if (!project.announcements) {
      project.announcements = [];
    }
    project.announcements.push(announcement);
    await project.save();
  }

  async updateSnapshot(projectId: string, snapshot: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    project.snapshot = snapshot;
    await project.save();
  }

  async updateStatus(projectId: string, status: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    project.status = status;
    await project.save();
  }
}
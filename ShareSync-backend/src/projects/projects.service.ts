import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../app.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly appGateway: AppGateway,
  ) {}

  async create(project: { name: string; description: string; creatorEmail?: string; sharedWith: string[] }): Promise<ProjectDocument> {
    const createdProject = new this.projectModel({
      ...project,
      creatorEmail: project.creatorEmail || 'anonymous@example.com', // Fallback if creatorEmail is missing
    });
    const savedProject = await createdProject.save();

    // Emit projectCreated event
    this.appGateway.emitProjectCreated(savedProject);

    // Notify collaborators
    for (const collaborator of project.sharedWith) {
      if (collaborator !== project.creatorEmail) {
        await this.notificationsService.create({
          userId: collaborator, // Assuming userId is the email for simplicity
          content: `You were added to a new project: ${project.name}`,
        });
      }
    }

    // Emit team activity update
    this.appGateway.emitTeamActivity({
      content: `User ${project.creatorEmail || 'Anonymous'} created a new project: ${project.name}`,
      timestamp: new Date(),
    });

    return savedProject;
  }

  async findByUsername(username: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ $or: [{ creatorEmail: username }, { sharedWith: username }] }).exec();
  }

  async findById(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return project;
  }

  async update(id: string, updates: Partial<Project>): Promise<ProjectDocument> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!updatedProject) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return updatedProject;
  }

  async delete(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
  }
}
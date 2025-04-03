import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private notificationsService: NotificationsService,
    private pointsService: PointsService,
  ) {}

  async create(name: string, description: string, admin: string, color: string, sharedWith: { userId: string; role: string }[]) {
    try {
      const project = new this.projectModel({
        name,
        description,
        admin,
        color,
        sharedWith,
      });
      const savedProject = await project.save();

      // Notify collaborators
      for (const collaborator of sharedWith) {
        await this.notificationsService.create(
          collaborator.userId,
          'project_invite',
          `You've been invited to collaborate on ${name}!`,
          savedProject._id.toString(),
        );
      }

      // Award points to the admin for creating a project
      await this.pointsService.addPoints(admin, 10, 'create_project');

      return savedProject;
    } catch (error) {
      console.error('Error in create project:', error);
      throw new BadRequestException('Failed to create project');
    }
  }

  async findByUsername(username: string) {
    try {
      return await this.projectModel
        .find({
          $or: [
            { admin: username },
            { 'sharedWith.userId': username },
          ],
        })
        .exec();
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const project = await this.projectModel.findById(id).exec();
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      return project;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Project>) {
    try {
      const updatedProject = await this.projectModel
        .findByIdAndUpdate(id, updates, { new: true })
        .exec();
      if (!updatedProject) {
        throw new NotFoundException('Project not found');
      }

      // Notify collaborators of the update
      for (const collaborator of updatedProject.sharedWith) {
        await this.notificationsService.create(
          collaborator.userId,
          'project_update',
          `Project ${updatedProject.name} has been updated!`,
          updatedProject._id.toString(),
        );
      }

      return updatedProject;
    } catch (error) {
      console.error('Error in update project:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const project = await this.projectModel.findByIdAndDelete(id).exec();
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      return { message: 'Project deleted successfully' };
    } catch (error) {
      console.error('Error in delete project:', error);
      throw error;
    }
  }

  async likeProject(id: string, userId: string) {
    try {
      const project = await this.findById(id);
      project.likes += 1;
      await project.save();

      // Notify the project admin
      await this.notificationsService.create(
        project.admin,
        'project_like',
        `Your project ${project.name} received a like!`,
        project._id.toString(),
      );

      // Award points to the user for liking
      await this.pointsService.addPoints(userId, 1, 'like_project');

      return { message: 'Project liked successfully' };
    } catch (error) {
      console.error('Error in likeProject:', error);
      throw error;
    }
  }
}
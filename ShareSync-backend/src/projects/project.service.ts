// src/projects/project.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(data: Partial<Project>) {
    const created = new this.projectModel({
      ...data,
      updatedAt: new Date(),
      createdAt: new Date(),
    });
    return created.save();
  }

  async findAll(userId: string) {
    return this.projectModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    return this.projectModel.findById(id).lean();
  }

  async findOneOwned(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.projectModel.findOne({ _id: id, userId }).lean();
  }
}
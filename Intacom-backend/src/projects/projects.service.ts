import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
    const createdProject = new this.projectModel({
      ...createProjectDto,
      createdAt: new Date(),
    });
    return createdProject.save();
  }

  async findByUsername(username: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ creatorEmail: username }).exec();
  }

  async findById(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectDocument> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .exec();
    if (!updatedProject) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return updatedProject;
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
  }
}
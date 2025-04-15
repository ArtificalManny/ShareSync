import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: { name: string; description: string; sharedWith: string[]; creator: string }) {
    const project = new this.projectModel({
      ...createProjectDto,
      isPublic: false,
      createdAt: new Date(),
      teamActivity: [],
    });
    return project.save();
  }

  async findAllByUsername(username: string) {
    return this.projectModel.find({ $or: [{ creator: username }, { sharedWith: username }] }).populate('creator').exec();
  }

  async findById(id: string) {
    return this.projectModel.findById(id).populate('creator').exec();
  }

  async findPublic() {
    return this.projectModel.find({ isPublic: true }).populate('creator').exec();
  }

  async search(query: string) {
    const regex = new RegExp(query, 'i'); // Case-insensitive search
    return this.projectModel
      .find({
        $or: [
          { name: regex },
          { description: regex },
          { 'creator.username': regex },
        ],
        isPublic: true, // Only search public projects
      })
      .populate('creator')
      .exec();
  }

  async update(id: string, updateProjectDto: { name?: string; description?: string; isPublic?: boolean }) {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.projectModel.findByIdAndDelete(id).exec();
  }

  async addTeamActivity(projectId: string, activity: { user: string; action: string; timestamp: string }) {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { teamActivity: activity } },
      { new: true }
    ).exec();
  }
}
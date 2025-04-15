import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea, IdeaDocument } from './schemas/idea.schema';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
  ) {}

  async create(createIdeaDto: { content: string; projectId: string; creatorId: string }) {
    const idea = new this.ideaModel({
      content: createIdeaDto.content,
      project: createIdeaDto.projectId,
      creator: createIdeaDto.creatorId,
      createdAt: new Date(),
    });
    return idea.save();
  }

  async findByProjectId(projectId: string) {
    return this.ideaModel.find({ project: projectId }).populate('creator').exec();
  }
}
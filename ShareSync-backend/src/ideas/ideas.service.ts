import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea } from './idea.schema';

@Injectable()
export class IdeasService {
  constructor(@InjectModel('Idea') private ideaModel: Model<Idea>) {}

  async createIdea(title: string, description: string, creator: string, project?: string): Promise<Idea> {
    const idea = new this.ideaModel({ title, description, creator, project });
    return idea.save();
  }

  async getIdeas(projectId?: string): Promise<Idea[]> {
    if (projectId) {
      return this.ideaModel.find({ project: projectId }).populate('creator').exec();
    }
    return this.ideaModel.find().populate('creator').exec();
  }
}
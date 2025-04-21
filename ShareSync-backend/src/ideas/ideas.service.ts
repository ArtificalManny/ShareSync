import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea } from './idea.schema';

@Injectable()
export class IdeasService {
  constructor(@InjectModel('Idea') private readonly ideaModel: Model<Idea>) {}

  async create(createIdeaDto: { title: string; description: string; userId: string }): Promise<Idea> {
    const idea = new this.ideaModel(createIdeaDto);
    return idea.save();
  }

  async findByUser(userId: string): Promise<Idea[]> {
    return this.ideaModel.find({ userId }).exec();
  }
}
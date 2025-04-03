import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>) {}

  async create(userId: string, projectId: string, message: string, rating: number) {
    const feedback = new this.feedbackModel({
      userId,
      projectId,
      message,
      rating,
    });
    return feedback.save();
  }

  async findByProject(projectId: string) {
    return this.feedbackModel.find({ projectId }).exec();
  }
}
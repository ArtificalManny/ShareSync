import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(createFeedbackDto: { feedback: string; featureRequest?: string; category: string }) {
    const feedback = new this.feedbackModel({
      ...createFeedbackDto,
      createdAt: new Date(),
    });
    return feedback.save();
  }
}
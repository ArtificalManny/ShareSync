import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(@InjectModel('Feedback') private feedbackModel: Model<Feedback>) {}

  async submitFeedback(userId: string, content: string, rating: number): Promise<Feedback> {
    const feedback = new this.feedbackModel({ userId, content, rating });
    return feedback.save();
  }

  async getFeedback(): Promise<Feedback[]> {
    return this.feedbackModel.find().exec();
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>) {}

  async create(projectId: string, userId: string, rating: number, message: string): Promise<Feedback> {
    try {
      const feedback = new this.feedbackModel({
        projectId,
        userId,
        rating,
        message,
      });
      return await feedback.save();
    } catch (error) {
      console.error('Error in create feedback:', error);
      throw error;
    }
  }

  async findByProject(projectId: string): Promise<Feedback[]> {
    try {
      return await this.feedbackModel.find({ projectId }).exec();
    } catch (error) {
      console.error('Error in findByProject:', error);
      throw error;
    }
  }

  async findByProjectId(projectId: string): Promise<Feedback[]> {
    try {
      return await this.feedbackModel.find({ projectId }).exec();
    } catch (error) {
      console.error('Error in findByProjectId:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const result = await this.feedbackModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Feedback not found');
      }
      return { message: 'Feedback deleted successfully' };
    } catch (error) {
      console.error('Error in delete feedback:', error);
      throw error;
    }
  }
}
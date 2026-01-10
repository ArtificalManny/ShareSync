import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './message.schema';

@Injectable()
export class MessageService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) {}

  async getConversations(userId: string): Promise<string[]> {
    const messages = await this.messageModel
      .find({
        $or: [{ senderId: userId }, { recipientId: userId }],
      })
      .distinct('conversationId')
      .exec();
    return messages;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageModel.find({ conversationId }).sort({ createdAt: 1 }).exec();
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const message = new this.messageModel({ conversationId, senderId, content });
    return message.save();
  }
}
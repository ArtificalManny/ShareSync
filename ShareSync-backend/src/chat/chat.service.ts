import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel('ChatMessage') private chatMessageModel: Model<ChatMessage>) {}

  async saveMessage(projectId: string, senderId: string, message: string): Promise<ChatMessage> {
    const chatMessage = new this.chatMessageModel({ projectId, senderId, message });
    return chatMessage.save();
  }

  async getMessages(projectId: string): Promise<ChatMessage[]> {
    return this.chatMessageModel.find({ projectId }).sort({ timestamp: 1 }).exec();
  }
}
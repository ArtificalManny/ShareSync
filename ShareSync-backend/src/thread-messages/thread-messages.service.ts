import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';
import { CreateThreadMessageDto } from './dto/create-thread-message.dto';

export interface GetThreadMessagesOptions {
  limit?: number;
  before?: string;
}

const USER_POPULATE_FIELDS = 'firstName lastName username email profilePicture avatar avatarUrl';

@Injectable()
export class ThreadMessagesService {
  constructor(
    @InjectModel(ThreadMessage.name) private readonly messageModel: Model<ThreadMessageDocument>,
  ) {}

  async create(threadId: string, userId: string, dto: CreateThreadMessageDto): Promise<ThreadMessageDocument> {
    const message = new this.messageModel({
      threadId: new Types.ObjectId(threadId),
      userId: new Types.ObjectId(userId),
      content: dto.content,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      reactions: [],
      attachments: [],
      isEdited: false,
    });

    return message.save();
  }

  async findById(messageId: string): Promise<ThreadMessageDocument> {
    const msg = await this.messageModel.findById(messageId);
    if (!msg) throw new NotFoundException(`ThreadMessage with ID ${messageId} not found`);
    return msg;
  }

  async findByThread(threadId: string, options: GetThreadMessagesOptions = {}): Promise<ThreadMessageDocument[]> {
    const limit = options.limit ?? 50;
    const query: any = { threadId: new Types.ObjectId(threadId) };

    if (options.before) {
      query.createdAt = { $lt: new Date(options.before) };
    }

    return this.messageModel
      .find(query)
      .populate('userId', USER_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async edit(messageId: string, userId: string, content: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);

    if (!msg.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    msg.content = content;
    msg.isEdited = true;
    msg.editedAt = new Date();

    return msg.save();
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const msg = await this.findById(messageId);

    if (!msg.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.deleteOne({ _id: msg._id });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);
    const userObjectId = new Types.ObjectId(userId);

    const existing = msg.reactions.find((r: any) => r.emoji === emoji);

    if (existing) {
      if (!existing.users.some((u: Types.ObjectId) => u.equals(userObjectId))) {
        existing.users.push(userObjectId);
      }
    } else {
      msg.reactions.push({
        emoji,
        users: [userObjectId],
      } as any);
    }

    return msg.save();
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const msg = await this.findById(messageId);
    const userObjectId = new Types.ObjectId(userId);

    const reaction = msg.reactions.find((r: any) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((u: Types.ObjectId) => !u.equals(userObjectId));
      if (reaction.users.length === 0) {
        msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
      }
    }

    return msg.save();
  }
}

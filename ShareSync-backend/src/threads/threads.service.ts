// src/threads/threads.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread, ThreadDocument } from './schemas/thread.schema';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';

export interface CreateThreadDto {
  projectId: string;
  title: string;
  category?: 'planning' | 'design' | 'ops' | 'general';
  content?: string;
}

export interface CreateMessageDto {
  content: string;
  mentions?: string[];
}

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
}

export interface FindThreadsOptions {
  category?: string;
  isPinned?: boolean;
}

const USER_POPULATE_FIELDS = 'firstName lastName username email profilePicture avatar avatarUrl';

@Injectable()
export class ThreadsService {
  constructor(
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>,
    @InjectModel(ThreadMessage.name) private messageModel: Model<ThreadMessageDocument>,
  ) {}

  async create(userId: string, dto: CreateThreadDto): Promise<ThreadDocument> {
    const userObjectId = new Types.ObjectId(userId);

    const thread = new this.threadModel({
      projectId: new Types.ObjectId(dto.projectId),
      title: dto.title,
      category: dto.category || 'general',
      createdBy: userObjectId,
      participants: [userObjectId],
      isPinned: false,
      isLocked: false,
      replyCount: 0,
    });

    const savedThread = await thread.save();

    if (dto.content) {
      await this.addMessage(savedThread._id.toString(), userId, {
        content: dto.content,
      });
    }

    return savedThread;
  }

  async findById(id: string): Promise<ThreadDocument> {
    const thread = await this.threadModel
      .findById(id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('lastReplyBy', USER_POPULATE_FIELDS)
      .exec();

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }

    return thread;
  }

  async findByProject(projectId: string, options: FindThreadsOptions = {}, userId?: string): Promise<ThreadDocument[]> {
    const query: any = { projectId: new Types.ObjectId(projectId) };

    if (options.category) {
      query.category = options.category;
    }

    if (options.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    let threads = await this.threadModel
      .find(query)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('lastReplyBy', USER_POPULATE_FIELDS)
      .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 })
      .exec();

    if (threads.length === 0 && !options.category && userId) {
      const generalThread = await this.create(userId, {
        projectId,
        title: 'General',
        category: 'general',
        content: "Welcome to the project! This is the general discussion thread. Feel free to start chatting."
      });
      
      // ✅ FIX: Added `as any` to bypass Mongoose strict typings
      threads = [await this.findById(generalThread._id.toString())] as any;
    }

    return threads;
  }

  async update(id: string, userId: string, updates: Partial<Thread>): Promise<ThreadDocument> {
    const thread = await this.findById(id);
    Object.assign(thread, updates);
    return thread.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const thread = await this.findById(id);
    await this.messageModel.deleteMany({ threadId: thread._id });
    await this.threadModel.deleteOne({ _id: thread._id });
  }

  async addMessage(threadId: string, userId: string, dto: CreateMessageDto): Promise<ThreadMessageDocument> {
    const thread = await this.findById(threadId);
    const userObjectId = new Types.ObjectId(userId);

    const message = new this.messageModel({
      threadId: thread._id,
      userId: userObjectId,
      content: dto.content,
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
      reactions: [],
      attachments: [],
      isEdited: false,
    });

    const savedMessage = await message.save();

    await this.threadModel.updateOne(
      { _id: thread._id },
      {
        $inc: { replyCount: 1 },
        $set: {
          lastReplyAt: new Date(),
          lastReplyBy: userObjectId,
        },
        $addToSet: { participants: userObjectId },
      },
    );

    return savedMessage;
  }

  async getMessages(threadId: string, options: GetMessagesOptions = {}): Promise<ThreadMessageDocument[]> {
    const limit = options.limit || 50;
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

  async updateMessage(messageId: string, userId: string, content: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    if (!message.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    return message.save();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    if (!message.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const threadId = message.threadId;
    await this.messageModel.deleteOne({ _id: message._id });

    await this.threadModel.updateOne({ _id: threadId }, { $inc: { replyCount: -1 } });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    const userObjectId = new Types.ObjectId(userId);
    const existingReaction = message.reactions.find((r: any) => r.emoji === emoji);

    if (existingReaction) {
      if (!existingReaction.users.some((u: Types.ObjectId) => u.equals(userObjectId))) {
        existingReaction.users.push(userObjectId);
      }
    } else {
      message.reactions.push({
        emoji,
        users: [userObjectId],
      } as any);
    }

    return message.save();
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    const userObjectId = new Types.ObjectId(userId);
    const reaction = message.reactions.find((r: any) => r.emoji === emoji);
    
    if (reaction) {
      reaction.users = reaction.users.filter((u: Types.ObjectId) => !u.equals(userObjectId));
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter((r: any) => r.emoji !== emoji);
      }
    }

    return message.save();
  }

  async togglePin(threadId: string, userId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.isPinned = !thread.isPinned;
    return thread.save();
  }

  async toggleLock(threadId: string, userId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.isLocked = !thread.isLocked;
    return thread.save();
  }

  async markAsRead(threadId: string, userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    await this.threadModel.updateOne(
      {
        _id: new Types.ObjectId(threadId),
        'readStatus.userId': { $ne: userObjectId },
      },
      {
        $push: {
          readStatus: {
            userId: userObjectId,
            lastReadAt: new Date(),
          },
        },
      },
    );

    await this.threadModel.updateOne(
      {
        _id: new Types.ObjectId(threadId),
        'readStatus.userId': userObjectId,
      },
      {
        $set: {
          'readStatus.$.lastReadAt': new Date(),
        },
      },
    );
  }

  async getUnreadCount(projectId: string, userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const threads = await this.threadModel.find({
      projectId: new Types.ObjectId(projectId),
      participants: userObjectId,
    });

    let unreadCount = 0;

    for (const thread of threads) {
      const readStatus = thread.readStatus.find((rs: any) => rs.userId.equals(userObjectId));

      if (!readStatus) {
        unreadCount += thread.replyCount;
      } else if (thread.lastReplyAt && thread.lastReplyAt > readStatus.lastReadAt) {
        const newMessages = await this.messageModel.countDocuments({
          threadId: thread._id,
          createdAt: { $gt: readStatus.lastReadAt },
          userId: { $ne: userObjectId },
        });
        unreadCount += newMessages;
      }
    }

    return unreadCount;
  }

  async linkTask(threadId: string, taskId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    const taskObjectId = new Types.ObjectId(taskId);

    if (!thread.linkedTasks.some((id: Types.ObjectId) => id.equals(taskObjectId))) {
      thread.linkedTasks.push(taskObjectId);
      await thread.save();
    }

    return thread;
  }

  async unlinkTask(threadId: string, taskId: string): Promise<ThreadDocument> {
    const thread = await this.findById(threadId);
    thread.linkedTasks = thread.linkedTasks.filter(
      (id: Types.ObjectId) => !id.equals(new Types.ObjectId(taskId)),
    );
    return thread.save();
  }

  async search(projectId: string, query: string): Promise<ThreadMessageDocument[]> {
    const threads = await this.threadModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .select('_id');

    const threadIds = threads.map((t: any) => t._id);

    return this.messageModel
      .find({
        threadId: { $in: threadIds },
        content: { $regex: query, $options: 'i' },
      })
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('threadId', 'title')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}

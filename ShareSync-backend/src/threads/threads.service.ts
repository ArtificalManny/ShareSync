// src/threads/threads.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread, ThreadDocument } from './schemas/thread.schema';
import { ThreadMessage, ThreadMessageDocument } from './schemas/thread-message.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateThreadDto {
  projectId: string;
  title: string;
  category?: 'planning' | 'design' | 'ops' | 'general';
  content?: string; // Initial message content
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

@Injectable()
export class ThreadsService {
  constructor(
    @InjectModel(Thread.name) private threadModel: Model<ThreadDocument>,
    @InjectModel(ThreadMessage.name) private messageModel: Model<ThreadMessageDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // THREAD CRUD
  // ═══════════════════════════════════════════════════════════════════════════════

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

    // If initial content provided, create the first message
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
      .populate('createdBy', 'firstName lastName username avatar')
      .populate('lastReplyBy', 'firstName lastName username avatar')
      .exec();

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }

    return thread;
  }

  async findByProject(projectId: string, options: FindThreadsOptions = {}): Promise<ThreadDocument[]> {
    const query: any = { projectId: new Types.ObjectId(projectId) };

    if (options.category) {
      query.category = options.category;
    }

    if (options.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    return this.threadModel
      .find(query)
      .populate('createdBy', 'firstName lastName username avatar')
      .populate('lastReplyBy', 'firstName lastName username avatar')
      .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 })
      .exec();
  }

  async update(id: string, userId: string, updates: Partial<Thread>): Promise<ThreadDocument> {
    const thread = await this.findById(id);

    // Only allow creator or admin to update
    // For now, we'll just allow the update
    Object.assign(thread, updates);

    return thread.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const thread = await this.findById(id);

    // Delete all messages in the thread
    await this.messageModel.deleteMany({ threadId: thread._id });

    // Delete the thread
    await this.threadModel.deleteOne({ _id: thread._id });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MESSAGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

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

    // Update thread stats
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
      .populate('userId', 'firstName lastName username avatar')
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

    // Update thread reply count
    await this.threadModel.updateOne({ _id: threadId }, { $inc: { replyCount: -1 } });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ThreadMessageDocument> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    const userObjectId = new Types.ObjectId(userId);

    // Check if reaction exists
    const existingReaction = message.reactions.find((r: any) => r.emoji === emoji);

    if (existingReaction) {
      // Add user to existing reaction if not already there
      if (!existingReaction.users.some((u: Types.ObjectId) => u.equals(userObjectId))) {
        existingReaction.users.push(userObjectId);
      }
    } else {
      // Create new reaction
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

      // Remove reaction if no users left
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter((r: any) => r.emoji !== emoji);
      }
    }

    return message.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // THREAD MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

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

    // Also update existing read status
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
        // Never read this thread
        unreadCount += thread.replyCount;
      } else if (thread.lastReplyAt && thread.lastReplyAt > readStatus.lastReadAt) {
        // Has new messages since last read
        const newMessages = await this.messageModel.countDocuments({
          threadId: thread._id,
          createdAt: { $gt: readStatus.lastReadAt },
          userId: { $ne: userObjectId }, // Don't count own messages
        });
        unreadCount += newMessages;
      }
    }

    return unreadCount;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TASK LINKING
  // ═══════════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════════

  async search(projectId: string, query: string): Promise<ThreadMessageDocument[]> {
    // Get all thread IDs for this project
    const threads = await this.threadModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .select('_id');

    const threadIds = threads.map((t: any) => t._id);

    return this.messageModel
      .find({
        threadId: { $in: threadIds },
        content: { $regex: query, $options: 'i' },
      })
      .populate('userId', 'firstName lastName username avatar')
      .populate('threadId', 'title')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}

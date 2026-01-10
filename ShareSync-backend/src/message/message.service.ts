import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageContext, MessageEnergy } from './message.schema';

// Energy costs
const ENERGY_COSTS = {
  [MessageEnergy.URGENT]: 10,
  [MessageEnergy.NORMAL]: 3,
  [MessageEnergy.ASYNC]: 1,
};

// Daily energy pool per user
const DAILY_ENERGY_LIMIT = 100;

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  // Get user's conversations (grouped by conversationId)
  async getConversations(userId: string) {
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: new Types.ObjectId(userId) },
            { recipientId: new Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', new Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.senderId',
          foreignField: '_id',
          as: 'sender',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.recipientId',
          foreignField: '_id',
          as: 'recipient',
        },
      },
      {
        $project: {
          conversationId: '$_id',
          lastMessage: 1,
          unreadCount: 1,
          sender: { $arrayElemAt: ['$sender', 0] },
          recipient: { $arrayElemAt: ['$recipient', 0] },
        },
      },
    ]);

    return conversations;
  }

  // Get messages in a conversation
  async getMessages(conversationId: string, limit = 50) {
    return this.messageModel
      .find({ conversationId })
      .populate('senderId', 'firstName lastName username profilePicture')
      .populate('recipientId', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // Get thread messages
  async getThread(threadParentId: string) {
    const parent = await this.messageModel
      .findById(threadParentId)
      .populate('senderId', 'firstName lastName username profilePicture')
      .exec();

    const replies = await this.messageModel
      .find({ threadParentId: new Types.ObjectId(threadParentId) })
      .populate('senderId', 'firstName lastName username profilePicture')
      .sort({ createdAt: 1 })
      .exec();

    return { parent, replies };
  }

  // Send message with energy system
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    recipientId?: string;
    content: string;
    context?: MessageContext;
    energy?: MessageEnergy;
    threadParentId?: string;
  }) {
    const {
      conversationId,
      senderId,
      recipientId,
      content,
      context = MessageContext.DIRECT,
      energy = MessageEnergy.NORMAL,
      threadParentId,
    } = data;

    // Calculate energy cost
    const energyCost = ENERGY_COSTS[energy];

    // Check if user has enough energy (implement energy tracking later)
    // For now, just log it
    console.log(`[Energy] ${senderId} spending ${energyCost} energy`);

    // Create message
    const message = new this.messageModel({
      conversationId,
      senderId: new Types.ObjectId(senderId),
      recipientId: recipientId ? new Types.ObjectId(recipientId) : undefined,
      content,
      context,
      energy,
      energyCost,
      threadParentId: threadParentId ? new Types.ObjectId(threadParentId) : undefined,
    });

    const saved = await message.save();

    // If this is a reply, update parent's threadReplies
    if (threadParentId) {
      await this.messageModel.findByIdAndUpdate(threadParentId, {
        $addToSet: { threadReplies: saved._id },
      });
    }

    return saved.populate([
      { path: 'senderId', select: 'firstName lastName username profilePicture' },
      { path: 'recipientId', select: 'firstName lastName username profilePicture' },
    ]);
  }

  // Mark message as read
  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // Only recipient can mark as read
    if (message.recipientId?.toString() !== userId) {
      throw new BadRequestException('Not authorized');
    }

    message.isRead = true;
    message.readAt = new Date();
    return message.save();
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(conversationId: string, userId: string) {
    return this.messageModel.updateMany(
      {
        conversationId,
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
    );
  }

  // Get unread count for user
  async getUnreadCount(userId: string) {
    return this.messageModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // Only sender can delete
    if (message.senderId.toString() !== userId) {
      throw new BadRequestException('Not authorized');
    }

    return this.messageModel.findByIdAndDelete(messageId);
  }
}

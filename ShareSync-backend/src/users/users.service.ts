import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { password: newPassword } }).exec();
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $addToSet: { following: targetUserId } }).exec();
    await this.userModel.updateOne({ _id: targetUserId }, { $addToSet: { followers: userId } }).exec();
    this.notificationsGateway.sendNotification(targetUserId, {
      message: `User ${userId} followed you`,
      timestamp: new Date(),
      read: false,
      type: 'follow',
      relatedId: userId,
    });
  }

  async endorseSkill(userId: string, targetUserId: string, skill: string): Promise<void> {
    await this.userModel.updateOne({ _id: targetUserId }, { $addToSet: { endorsements: skill } }).exec();
    this.notificationsGateway.sendNotification(targetUserId, {
      message: `User ${userId} endorsed your skill: ${skill}`,
      timestamp: new Date(),
      read: false,
      type: 'endorsement',
      relatedId: userId,
    });
  }

  async awardBadge(userId: string, badge: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $addToSet: { badges: badge } }).exec();
    this.notificationsGateway.sendNotification(userId, {
      message: `You earned a new badge: ${badge}!`,
      timestamp: new Date(),
      read: false,
      type: 'badge',
      relatedId: badge,
    });
  }

  async addPoints(userId: string, points: number): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $inc: { points } }).exec();
    this.notificationsGateway.sendNotification(userId, {
      message: `You earned ${points} points!`,
      timestamp: new Date(),
      read: false,
      type: 'points',
      relatedId: points.toString(),
    });
  }

  async updateProfile(userId: string, updates: { username?: string; firstName?: string; lastName?: string; birthday?: Date; bio?: string; skills?: string[] }): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
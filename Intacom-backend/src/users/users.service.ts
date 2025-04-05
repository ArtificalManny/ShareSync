import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByUsername(username: string): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({ username })
        .select('-password')
        .lean()
        .exec();
      if (!user) {
        throw new NotFoundException(`User with username ${username} not found`);
      }
      return user;
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel
        .findById(id)
        .select('-password')
        .lean()
        .exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userModel
        .find()
        .select('-password')
        .lean()
        .exec();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updates, { new: true })
        .select('-password')
        .lean()
        .exec();
      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }
      return updatedUser;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async create(userData: Partial<User>): Promise<Omit<User, 'password'>> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password || '', 10);
      const newUser = new this.userModel({
        ...userData,
        password: hashedPassword,
      });
      const savedUser = await newUser.save();
      // Exclude password from the response
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
}
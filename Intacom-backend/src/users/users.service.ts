import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const createdUser = new this.userModel(createUserDto);
      return await createdUser.save();
    } catch (error) {
      console.error('Error in create user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  async findByUsername(username: string) {
    try {
      const user = await this.userModel.findOne({ username }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return { data: user };
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.userModel.find().exec();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }
      return updatedUser;
    } catch (error) {
      console.error('Error in update user:', error);
      throw error;
    }
  }

  async follow(userId: string, followId: string) {
    try {
      const user = await this.findById(userId);
      const followUser = await this.findById(followId);

      if (!user.following.includes(followId)) {
        user.following.push(followId);
        followUser.followers.push(userId);
        await user.save();
        await followUser.save();
      }

      return { message: 'Followed successfully' };
    } catch (error) {
      console.error('Error in follow:', error);
      throw error;
    }
  }

  async unfollow(userId: string, unfollowId: string) {
    try {
      const user = await this.findById(userId);
      const unfollowUser = await this.findById(unfollowId);

      user.following = user.following.filter(id => id !== unfollowId);
      unfollowUser.followers = unfollowUser.followers.filter(id => id !== userId);
      await user.save();
      await unfollowUser.save();

      return { message: 'Unfollowed successfully' };
    } catch (error) {
      console.error('Error in unfollow:', error);
      throw error;
    }
  }
}
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(userData: { email: string; firstName: string; lastName: string; password: string }) {
    console.log('UsersService: Creating user with data:', userData);
    const user = new this.userModel(userData);
    const savedUser = await user.save();
    console.log('UsersService: User created:', savedUser);
    return savedUser;
  }

  async findByEmail(email: string) {
    console.log('UsersService: Finding user by email:', email);
    const user = await this.userModel.findOne({ email }).exec();
    console.log('UsersService: Find result:', user);
    return user;
  }

  async findById(id: string) {
    console.log('UsersService: Finding user by id:', id);
    const user = await this.userModel.findById(id).exec();
    console.log('UsersService: Find result:', user);
    return user;
  }

  async updatePassword(userId: string, newPassword: string) {
    console.log('UsersService: Updating password for userId:', userId);
    return this.userModel.findByIdAndUpdate(userId, { password: newPassword }, { new: true }).exec();
  }
}
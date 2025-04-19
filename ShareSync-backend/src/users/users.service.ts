import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async findOneByEmail(email: string): Promise<User | null> {
    console.log('UsersService: Finding user by email:', email);
    const user = await this.userModel.findOne({ email }).exec();
    console.log('UsersService: Find result:', user);
    return user;
  }

  async findOneById(id: string): Promise<User | null> {
    console.log('UsersService: Finding user by id:', id);
    const user = await this.userModel.findById(id).exec();
    console.log('UsersService: Find result:', user);
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    console.log('UsersService: Creating user with data:', userData);
    const newUser = new this.userModel(userData);
    const savedUser = await newUser.save();
    console.log('UsersService: User created:', savedUser);
    return savedUser;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    console.log('UsersService: Updating password for userId:', userId);
    await this.userModel.updateOne({ _id: userId }, { $set: { password: newPassword } }).exec();
  }
}
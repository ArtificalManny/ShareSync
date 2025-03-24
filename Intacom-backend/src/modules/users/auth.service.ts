import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async register(userData: any): Promise<User> {
    const { password, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({ ...rest, password: hashedPassword });
    return await newUser.save();
  }

  async login(identifier: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async recover(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const token = Math.random().toString(36).substring(2);
    return { message: 'Recovery token generated', token };
  }

  async reset(token: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.userModel.findOneAndUpdate(
      { email: 'eamonrivas@gmail.com' }, // Simplified for demo; in production, use token to find user
      { password: hashedPassword },
      { new: true }
    );
    if (!user) {
      throw new Error('User not found');
    }
    return { message: 'Password reset successful', user };
  }

  async updateUser(id: string, userData: any): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, userData, { new: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
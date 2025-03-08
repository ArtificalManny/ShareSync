import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../models/user.model'; // Adjusted path
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async register(username: string, password: string, email: string, name: string, age: number, profilePic?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) throw new Error('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ username, password: hashedPassword, email, name, age, profilePic });
    return user.save();
  }

  async login(username: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async findUser(username: string): Promise<User | null> {
    return this.userModel.findOne({ username });
  }

  async recoverPassword(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new Error('Email not found');
    const token = Math.random().toString(36).substring(2); // Temporary token
    // In production, use a proper token generation and email service
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();
    return token; // Send this token via email in a real system
  }
}
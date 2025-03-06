import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../models/user.model'; // Updated path
import * as bcrypt from 'bcrypt'; // Explicit import for bcrypt

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async register(username: string, password: string, profilePic?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) throw new Error('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ username, password: hashedPassword, profilePic });
    return user.save();
  }

  async login(username: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async findUser(username: string): Promise<User | null> {
    return this.userModel.findOne({ username });
  }
}
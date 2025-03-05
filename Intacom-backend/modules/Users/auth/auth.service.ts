// src/routes/auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models/user.model';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async login(username: string, password: string) {
    return this.userModel.findOne({ username, password });
  }

  async register(username: string, password: string, profilePic?: string) {
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new Error('Username taken');
    }
    const newUser = new this.userModel({ username, password, profilePic: profilePic || 'default-profile.jpg' });
    return newUser.save();
  }
}
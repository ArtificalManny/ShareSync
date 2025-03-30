import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { User, UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async login(identifier: string, password: string): Promise<User> {
    const cacheKey = `user:${identifier}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);

    if (cachedUser) {
      const isPasswordValid = await bcrypt.compare(password, cachedUser.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return cachedUser;
    }

    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.cacheManager.set(cacheKey, user, { ttl: 300 }); // Cache for 5 minutes
    return user;
  }

  async register(userData: Partial<User>): Promise<User> {
    const { password, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({
      ...rest,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    const cacheKey = `user:${savedUser.email}`;
    await this.cacheManager.set(cacheKey, savedUser, { ttl: 300 });
    return savedUser;
  }

  async recoverPassword(email: string): Promise<{ message: string; token: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = uuidv4();
    // In a real application, you’d store the token and send it via email
    return { message: 'Recovery token generated', token };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string; user: User }> {
    const user = await this.userModel.findOne(); // Simplified for demo
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    const cacheKey = `user:${user.email}`;
    await this.cacheManager.set(cacheKey, user, { ttl: 300 });
    return { message: 'Password reset successfully', user };
  }
}
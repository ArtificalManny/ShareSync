import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async login(identifier: string, password: string): Promise<User> {
    try {
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

      return user;
    } catch (error) {
      console.error('Error in login:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process login request');
    }
  }

  async register(userData: Partial<User>): Promise<User> {
    try {
      const { password, ...rest } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new this.userModel({
        ...rest,
        password: hashedPassword,
      });
      return await newUser.save();
    } catch (error) {
      console.error('Error in register:', error);
      throw new InternalServerErrorException('Failed to process registration request');
    }
  }

  async recoverPassword(email: string): Promise<{ message: string; token: string }> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const token = uuidv4();
      // In a real application, you’d store the token and send it via email
      return { message: 'Recovery token generated', token };
    } catch (error) {
      console.error('Error in recoverPassword:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process password recovery request');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string; user: User }> {
    try {
      // In a real application, you’d validate the token
      const user = await this.userModel.findOne(); // Simplified for demo
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return { message: 'Password reset successfully', user };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process password reset request');
    }
  }
}
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async register(userData: any): Promise<User> {
    const newUser = new this.userModel(userData);
    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: 'Welcome to Intacom!',
      text: `Hello ${userData.firstName},\n\nThank you for registering with Intacom! Your username is ${userData.username}.\n\nBest regards,\nThe Intacom Team`,
    };

    await transporter.sendMail(mailOptions);
    return newUser;
  }

  async login(identifier: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      password,
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async recover(email: string): Promise<{ message: string; token: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const token = Math.random().toString(36).substring(2, 15);
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Recovery - Intacom',
      text: `Hello,\n\nYou requested a password recovery. Use this token to reset your password: ${token}\n\nBest regards,\nThe Intacom Team`,
    };

    await transporter.sendMail(mailOptions);
    return { message: 'Recovery email sent', token };
  }

  async reset(token: string, newPassword: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { email: { $exists: true } },
      { password: newPassword },
      { new: true },
    );
    if (!user) {
      throw new Error('Invalid token or user not found');
    }
    return user;
  }
}
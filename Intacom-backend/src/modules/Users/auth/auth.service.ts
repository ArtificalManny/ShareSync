import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../models/user.model';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async register(firstName: string, lastName: string, username: string, password: string, email: string, gender: string, birthday: { month: string; day: string; year: string }, profilePic?: string): Promise<User> {
    // Validate required fields
    if (!firstName) throw new Error('First name is required');
    if (!lastName) throw new Error('Last name is required');
    if (!username) throw new Error('Username is required');
    if (!password) throw new Error('Password is required');
    if (!email) throw new Error('Email is required');
    if (!gender) throw new Error('Gender is required');
    if (!birthday || !birthday.month || !birthday.day || !birthday.year) throw new Error('Birthday (month, day, year) is required');

    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) throw new Error('Username already exists');

    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email,
      gender,
      birthday,
      profilePic,
    });
    const savedUser = await user.save();

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Intacom - Confirm Your Account',
        text: `Hello ${firstName},\n\nThank you for registering with Intacom! Please confirm your account by logging in.\n\nBest,\nThe Intacom Team`,
      });
    } catch (emailError: any) {
      console.error('Email sending error:', emailError.message);
      // Continue with registration even if email fails
    }

    return savedUser;
  }

  async login(identifier: string, password: string): Promise<User> {
    if (!identifier) throw new Error('Email or username is required');
    if (!password) throw new Error('Password is required');

    const user = await this.userModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async findUser(identifier: string): Promise<User | null> {
    return this.userModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  }

  async recoverPassword(email: string): Promise<{ message: string; token: string }> {
    if (!email) throw new Error('Email is required');

    const user = await this.userModel.findOne({ email });
    if (!user) throw new Error('Email not found');

    const token = Math.random().toString(36).substring(2);
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    return { message: 'Recovery token generated', token };
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    if (!token) throw new Error('Token is required');
    if (!newPassword) throw new Error('New password is required');

    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) throw new Error('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    return user.save();
  }
}
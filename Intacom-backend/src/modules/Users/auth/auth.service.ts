import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../models/user.model';
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

  async register(firstName: string, lastName: string, username: string, 
password: string, email: string, gender: string, birthday: { month: string; 
day: string; year: string }, profilePic?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) throw new Error('Username already exists');

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

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Intacom - Confirm Your Account',
      text: `Hello ${firstName},\n\nThank you for registering with Intacom! 
Please confirm your account by logging in.\n\nBest,\nThe Intacom Team`,
    });

    return savedUser;
  }

  async login(identifier: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ $or: [{ username: identifier 
}, { email: identifier }] });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async findUser(identifier: string): Promise<User | null> {
    return this.userModel.findOne({ $or: [{ username: identifier }, { email: 
identifier }] });
  }

  async recoverPassword(email: string): Promise<{ message: string; token: 
string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new Error('Email not found');

    const token = Math.random().toString(36).substring(2);
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 3600000);
    await user.save();

    return { message: 'Recovery token generated', token };
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
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

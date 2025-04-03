import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuid } from 'uuid';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private pointsService: PointsService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const { identifier, password } = loginDto;

      const user = await this.userModel
        .findOne({
          $or: [{ email: identifier }, { username: identifier }],
        })
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Please verify your email');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Award points for logging in
      await this.pointsService.addPoints(user._id.toString(), 2, 'login');

      return { data: { user } };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { firstName, lastName, username, email, password, gender, birthday } = registerDto;

      const existingUser = await this.userModel
        .findOne({
          $or: [{ email }, { username }],
        })
        .exec();

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = uuid();

      const user = new this.userModel({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        gender,
        birthday,
        verificationToken,
        isVerified: false,
      });

      await user.save();

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `
          <h1>Welcome to Intacom!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">Verify Email</a>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Award points for registering
      await this.pointsService.addPoints(user._id.toString(), 5, 'register');

      return { message: 'Registration successful. Please check your email to verify your account.' };
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  async recover(email: string) {
    try {
      const user = await this.userModel.findOne({ email }).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = uuid();
      user.resetToken = resetToken;
      await user.save();

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
        `,
      };

      await transporter.sendMail(mailOptions);

      return { message: 'Password reset email sent.' };
    } catch (error) {
      console.error('Error in recover:', error);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { token, password } = resetPasswordDto;

      const user = await this.userModel.findOne({ resetToken: token }).exec();

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetToken = undefined;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw error;
    }
  }
}
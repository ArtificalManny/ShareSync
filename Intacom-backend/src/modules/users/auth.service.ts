import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async login(identifier: string, password: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Please verify your email before logging in.');
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
      const verificationToken = uuidv4();
      const newUser = new this.userModel({
        ...rest,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
      });
      const savedUser = await newUser.save();

      // Send confirmation email
      const confirmationLink = `http://localhost:8080/verify-email?token=${verificationToken}`;
      const html = `
        <h2>Welcome to Intacom!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${confirmationLink}">Verify Email</a>
        <p>If you did not register for Intacom, please ignore this email.</p>
      `;
      await this.emailService.sendMail(savedUser.email, 'Verify Your Email - Intacom', html);

      return savedUser;
    } catch (error) {
      console.error('Error in register:', error);
      throw new InternalServerErrorException('Failed to process registration request');
    }
  }

  async verifyEmail(token: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ verificationToken: token });
      if (!user) {
        throw new NotFoundException('Invalid verification token');
      }
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
      return user;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async recoverPassword(email: string): Promise<{ message: string; token: string }> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = uuidv4();
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
      await user.save();

      // Send password reset email
      const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;
      const html = `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
      `;
      await this.emailService.sendMail(email, 'Password Reset - Intacom', html);

      return { message: 'Password reset email sent', token: resetToken };
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
      const user = await this.userModel.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      });
      if (!user) {
        throw new NotFoundException('Invalid or expired reset token');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      // Send confirmation email
      const html = `
        <h2>Password Reset Successful</h2>
        <p>Your password has been successfully reset. You can now log in with your new password.</p>
        <p>If you did not initiate this change, please contact support immediately.</p>
      `;
      await this.emailService.sendMail(user.email, 'Password Reset Confirmation - Intacom', html);

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
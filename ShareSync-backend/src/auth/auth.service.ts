import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResetToken } from '../reset-token/reset-token.schema';
import { UserDocument } from '../schemas/user.schema';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel('ResetToken') private readonly resetTokenModel: Model<ResetToken>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async register(userData: { email: string; firstName: string; lastName: string; username: string; password: string; gender: string; birthday: { month: string; day: string; year: string }; profilePicture?: string; bannerPicture?: string; school?: string; job?: string; projects?: string[] }): Promise<UserDocument> {
    return this.usersService.create(userData);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersService.findByEmail(email);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersService.findById(id);
  }

  async generateToken(user: any): Promise<string> {
    const payload = { email: user.email, sub: user._id };
    return this.jwtService.sign(payload);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const token = this.jwtService.sign({ userId: user._id }, { expiresIn: '1h' });
    await this.resetTokenModel.create({ token, userId: user._id, expiresAt: new Date(Date.now() + 3600000) });
    await this.sendResetEmail(email, token);
    return { message: `Reset link sent to ${email}` };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.resetTokenModel.findOne({ token });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
    }

    const user = await this.usersService.findById(resetToken.userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);
    await this.resetTokenModel.deleteOne({ token });

    return { message: 'Password reset successful' };
  }

  private async sendResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>This link will expire in 1 hour.</p>`,
    });
  }
}
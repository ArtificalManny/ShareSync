import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(loginDto: LoginDto): Promise<UserDocument> {
    console.log('AuthService: Login attempt with identifier:', loginDto.identifier);
    const user = await this.usersService.findByEmail(loginDto.identifier) || await this.usersService.findByUsername(loginDto.identifier);
    if (!user) {
      console.log('AuthService: User not found for identifier:', loginDto.identifier);
      throw new HttpException('Invalid username or password', HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      console.log('AuthService: Invalid password for user:', user.email);
      throw new HttpException('Invalid username or password', HttpStatus.BAD_REQUEST);
    }

    return user;
  }

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    console.log('AuthService: Register attempt with email:', registerDto.email);
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      console.log('AuthService: User already exists with email:', registerDto.email);
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      verificationToken: uuidv4(),
    });

    await this.sendVerificationEmail(user.email, user.verificationToken!);
    return user;
  }

  async sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT!, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email for INTACOM',
      text: `Please verify your email by clicking the following link: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    };

    await transporter.sendMail(mailOptions);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT!, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset for INTACOM',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
        ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
  }

  async resetPassword(token: string, newPassword: string, email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.resetPasswordToken !== token || (user.resetPasswordExpires && user.resetPasswordExpires < new Date())) {
      throw new HttpException('Password reset token is invalid or has expired', HttpStatus.BAD_REQUEST);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersService.findAll().then(users => users.find(u => u.verificationToken === token));
    if (!user) {
      throw new HttpException('Verification token is invalid', HttpStatus.BAD_REQUEST);
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
  }
}
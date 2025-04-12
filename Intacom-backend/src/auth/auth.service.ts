import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

// From "The Effortless Experience": Ensure user actions (e.g., login, register) are seamless.
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async login(loginDto: LoginDto): Promise<User> {
    const { identifier, password } = loginDto;
    console.log('AuthService: Validating user with identifier:', identifier);

    // Try to find the user by username or email.
    let user = await this.userModel.findOne({ username: identifier }).exec();
    if (!user) {
      console.log('AuthService: User not found by username, attempting to find by email:', identifier);
      user = await this.userModel.findOne({ email: identifier }).exec();
    }

    if (!user) {
      console.log('AuthService: User not found');
      throw new HttpException('Invalid username or password.', HttpStatus.BAD_REQUEST);
    }

    console.log('AuthService: User found:', user.email, 'with hashed password:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('AuthService: Password match result:', isMatch);

    if (!isMatch) {
      console.log('AuthService: Password does not match');
      throw new HttpException('Invalid username or password.', HttpStatus.BAD_REQUEST);
    }

    console.log('AuthService: User validated successfully:', user.email);
    return user;
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { firstName, lastName, username, email, password, gender, birthday } = registerDto;
    console.log('AuthService: Registering user with email:', email);

    // Validate birthday.
    const { month, day, year } = birthday;
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) {
      throw new HttpException('Invalid month. Must be between 1 and 12.', HttpStatus.BAD_REQUEST);
    }

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) {
      throw new HttpException(`Invalid day. Must be between 1 and ${daysInMonth} for the selected month.`, HttpStatus.BAD_REQUEST);
    }

    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      throw new HttpException('Invalid year. Must be between 1900 and the current year.', HttpStatus.BAD_REQUEST);
    }

    // Check if username or email already exists.
    const existingUser = await this.userModel.findOne({ $or: [{ username }, { email }] }).exec();
    if (existingUser) {
      console.log('AuthService: User already exists with username or email:', existingUser.username, existingUser.email);
      throw new HttpException('Username or email already exists.', HttpStatus.BAD_REQUEST);
    }

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('AuthService: Password hashed successfully');

    // Create the new user.
    const user = new this.userModel({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      gender,
      birthday,
      points: 0,
    });

    await user.save();
    console.log('AuthService: User registered successfully:', user.email);
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    console.log('AuthService: Processing forgot password for email:', email);
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      console.log('AuthService: User not found for email:', email);
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    // Generate a reset token.
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry.
    await user.save();
    console.log('AuthService: Reset token generated and saved for user:', user.email);

    // Send email with reset link using Nodemailer.
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:54693'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // Use TLS.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Intacom Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.firstName},</p>
        <p>We received a request to reset your password for your Intacom account.</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The Intacom Team</p>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('AuthService: Password reset email sent to:', email, 'Message ID:', info.messageId);
    } catch (error) {
      console.error('AuthService: Error sending password reset email:', error);
      throw new HttpException('Failed to send password reset email. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resetPassword(token: string, newPassword: string, email: string): Promise<void> {
    console.log('AuthService: Resetting password with token:', token, 'for email:', email);
    const user = await this.userModel
      .findOne({
        email,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      })
      .exec();

    if (!user) {
      console.log('AuthService: Invalid or expired reset token for email:', email);
      throw new HttpException('Invalid or expired reset token.', HttpStatus.BAD_REQUEST);
    }

    // Hash the new password.
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('AuthService: Password reset successful for user:', user.email);
  }
}
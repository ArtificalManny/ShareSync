import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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

    // In a real application, you would send an email with the reset link.
    // For now, we'll log the reset link for testing.
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:54693'}/reset-password?token=${token}`;
    console.log('AuthService: Password reset link (for testing):', resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('AuthService: Resetting password with token:', token);
    const user = await this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      })
      .exec();

    if (!user) {
      console.log('AuthService: Invalid or expired reset token');
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
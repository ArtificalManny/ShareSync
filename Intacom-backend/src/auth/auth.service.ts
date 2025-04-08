import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    console.log('Validating user with identifier:', identifier);
    const user = await this.usersService.findByUsername(identifier) || await this.usersService.findByEmail(identifier);
    if (!user) {
      console.log('User not found for identifier:', identifier);
      return null;
    }
    console.log('User found:', user.email, 'with hashed password:', user.password);
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);
    if (passwordMatch) {
      const { password, ...result } = user.toObject();
      console.log('User validated successfully:', result.email);
      return result;
    }
    console.log('Password does not match for user:', user.email);
    return null;
  }

  async login(user: any) {
    console.log('Login successful for user:', user.email);
    return {
      data: user,
    };
  }

  async register(userData: any) {
    console.log('Registering user with data:', userData);
    const existingUser = await this.usersService.findByUsername(userData.username) || await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      throw new NotFoundException('Username or email already exists');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = await this.usersService.create({
      ...userData,
      verificationToken,
      isVerified: false,
    });

    console.log('User registered successfully:', newUser.email);
    return {
      message: 'User registered successfully. Please verify your email.',
      data: newUser,
    };
  }

  async generateResetToken(email: string) {
    console.log('Generating reset token for email:', email);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.log('User not found for email:', email);
      throw new NotFoundException('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    await this.usersService.update(user._id.toString(), {
      resetToken,
      resetTokenExpiry,
    });

    console.log('Reset token generated for user:', user.email, 'Token:', resetToken);
    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    console.log('Resetting password with token:', token);
    const user = await this.usersService.findAll().then(users => users.find(u => u.resetToken === token));
    if (!user || user.resetTokenExpiry < Date.now()) {
      console.log('Invalid or expired reset token for token:', token);
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    console.log('Password reset successfully for user:', user.email);
    return { message: 'Password reset successfully' };
  }
}
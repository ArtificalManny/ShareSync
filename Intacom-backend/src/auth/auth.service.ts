import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(identifier) || await this.usersService.findByEmail(identifier);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    return {
      data: user,
    };
  }

  async register(userData: any) {
    const existingUser = await this.usersService.findByUsername(userData.username) || await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new NotFoundException('Username or email already exists');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = await this.usersService.create({
      ...userData,
      verificationToken,
      isVerified: false,
    });

    return {
      message: 'User registered successfully. Please verify your email.',
      data: newUser,
    };
  }

  async generateResetToken(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    await this.usersService.update(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findAll().then(users => users.find(u => u.resetToken === token));
    if (!user || user.resetTokenExpiry < Date.now()) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'Password reset successfully' };
  }
}
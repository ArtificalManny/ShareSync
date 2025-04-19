import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ResetTokenService } from '../reset-token/reset-token.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private resetTokenService: ResetTokenService,
  ) {}

  async login(email: string, password: string) {
    console.log('AuthService: Login attempt with email:', email, 'and password:', password);
    if (!email || !password) {
      console.log('AuthService: Email or password is undefined');
      throw new UnauthorizedException('Invalid username or password');
    }
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      console.log('AuthService: User not found for email:', email);
      throw new UnauthorizedException('Invalid username or password');
    }
    console.log('AuthService: Found user:', user.email, 'with password hash:', user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('AuthService: Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('AuthService: Password comparison failed for user:', email);
      throw new UnauthorizedException('Invalid username or password');
    }
    const payload = { sub: user._id, email: user.email };
    return {
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: { email: string; password: string; username?: string; firstName?: string; lastName?: string; birthday?: string }) {
    console.log('AuthService: Register attempt with email:', userData.email, 'userData:', userData);
    const existingUser = await this.usersService.findOneByEmail(userData.email);
    if (existingUser) {
      console.log('AuthService: User already exists with email:', userData.email);
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersService.create({
      email: userData.email,
      password: hashedPassword,
      username: userData.username || userData.email.split('@')[0],
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      birthday: userData.birthday ? new Date(userData.birthday) : undefined,
      isVerified: false,
      badges: [],
      endorsements: [],
      followers: [],
      following: [],
      hobbies: [],
      points: 0,
      notifications: [],
    });
    return { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const token = await this.resetTokenService.createToken(user._id);
    const resetLink = `http://localhost:54693/reset-password/${token}`;
    console.log('Password reset link (simulated email):', resetLink);
    return resetLink;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.resetTokenService.findToken(token);
    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const user = await this.usersService.findOneById(resetToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user._id, hashedPassword);
    await this.resetTokenService.deleteToken(token);
  }
}
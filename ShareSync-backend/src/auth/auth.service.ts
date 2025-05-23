import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;
    console.log('Login attempt with email:', email);
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      console.log('User not found for email:', email);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('User found:', { id: user._id.toString(), email: user.email, passwordHash: user.password });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password mismatch for email:', email);
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user._id.toString(), email: user.email };
    console.log('Login Payload:', payload);
    const access_token = this.jwtService.sign(payload);
    console.log('Generated Access Token:', access_token);
    const refresh_token = await this.generateRefreshToken(user._id.toString());
    return {
      access_token,
      refresh_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async register(registerDto: { email: string; password: string; firstName: string; lastName: string }) {
    const { email, password, firstName, lastName } = registerDto;
    try {
      console.log('Register attempt with email:', email);
      const existingUser = await this.userService.findOneByEmail(email);
      if (existingUser) {
        console.log('Email already exists:', email);
        throw new UnauthorizedException('Email already exists');
      }
      const user = await this.userService.create({ email, username: email.split('@')[0], password, firstName, lastName });
      console.log('User registered:', { id: user._id.toString(), email: user.email });
      const payload = { sub: user._id.toString(), email: user.email };
      console.log('Login Payload:', payload);
      const access_token = this.jwtService.sign(payload);
      console.log('Generated Access Token:', access_token);
      const refresh_token = await this.generateRefreshToken(user._id.toString());
      return {
        access_token,
        refresh_token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const tokenDoc = await this.refreshTokenModel.findOne({ token: refreshToken }).exec();
      if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      const user = await this.userService.findById(tokenDoc.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const payload = { sub: user._id.toString(), email: user.email };
      const access_token = this.jwtService.sign(payload);
      return { access_token };
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const refreshToken = new this.refreshTokenModel({ userId, token, expiresAt });
    await refreshToken.save();
    return token;
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { message: 'Password reset link sent' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user._id.toString(), { password: hashedPassword });
    return { message: 'Password reset successful' };
  }
}
// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log('🔵 CONTROLLER RECEIVED:', body);
    console.log('🔵 Calling service with:', body.email, body.password?.length, 'chars');
    
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(
    @Body() body: {
      email: string;
      username: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.userModel.create({
      email: body.email,
      username: body.username,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      verified: true,
    });

    // ✅ Generate JWT token like login does
    const payload = {
      sub: String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn: '7d',
    });

    // ✅ Return same format as login
    return {
      access_token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        roles: [],
      },
    };
  }

  @Post('verify')
  verify(@Body() body: { token: string }) {
    try {
      const decoded = this.jwtService.verify(body.token, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      });
      return { valid: true, user: decoded };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;
  }
}

// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
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

    return {
      message: 'User created successfully',
      userId: user._id,
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
}


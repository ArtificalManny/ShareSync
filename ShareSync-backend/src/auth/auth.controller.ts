// src/auth/auth.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTROLLER — Complete authentication endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/login
  // Standard email/password login
  // Returns needsVerification: true if user exists but not verified
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    console.log('🔵 CONTROLLER: LOGIN');

    const result: any = await this.authService.login(body.email, body.password);

    // Handle unverified user case
    if (result.needsVerification) {
      return {
        success: false,
        needsVerification: true,
        userId: result.userId,
        message: result.message,
      };
    }

    // Normal login success
    const access_token = result.access_token;
    const user = result.user;

    if (!access_token || !user) {
      console.error('❌ LOGIN RESPONSE MISSING TOKEN OR USER:', result);
      throw new UnauthorizedException('Invalid login response format');
    }

    return { success: true, access_token, user };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/register
  // Creates user with isVerified: false, sends verification code
  // ⚠️ MODIFIED: Now returns { userId } instead of { access_token, user }
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body()
    body: {
      email: string;
      username: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    console.log('🔵 CONTROLLER: REGISTER');

    const result = await this.authService.register(body);

    return {
      success: true,
      userId: result.userId,
      message: 'Verification code sent to your email',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/verify-email
  // Verifies OTP code, returns JWT immediately (no re-login required)
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { userId: string; code: string }) {
    console.log('🔵 CONTROLLER: VERIFY EMAIL');

    const result = await this.authService.verifyEmail(body.userId, body.code);

    return {
      success: true,
      user: result.user,
      token: result.token,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/resend-verification
  // Resends verification code
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { userId: string }) {
    console.log('�� CONTROLLER: RESEND VERIFICATION');

    await this.authService.resendVerificationCode(body.userId);

    return {
      success: true,
      message: 'New verification code sent',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/forgot-password
  // Sends password reset email
  // ALWAYS returns success (security: don't reveal if email exists)
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    console.log('🔵 CONTROLLER: FORGOT PASSWORD');

    await this.authService.forgotPassword(body.email);

    // ALWAYS return success (security)
    return {
      success: true,
      message: 'If an account exists, a reset link has been sent',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/validate-reset-token/:token
  // Validates reset token without consuming it
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    console.log('🔵 CONTROLLER: VALIDATE RESET TOKEN');

    const result = await this.authService.validateResetToken(token);

    return {
      valid: result.valid,
      email: result.email, // Partially masked
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/reset-password
  // Resets password, invalidates all existing sessions
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    console.log('🔵 CONTROLLER: RESET PASSWORD');

    await this.authService.resetPassword(body.token, body.newPassword);

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/check-username
  // Check if username is available
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    console.log('🔵 CONTROLLER: CHECK USERNAME');

    const available = await this.authService.isUsernameAvailable(username);

    return { available };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXISTING ENDPOINTS — PRESERVED
  // ═══════════════════════════════════════════════════════════════════════════

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

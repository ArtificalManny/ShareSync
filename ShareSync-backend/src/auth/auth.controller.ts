import { Controller, Post, Body, Get, UnauthorizedException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    console.log('AuthController: Login request received - email:', email, 'password:', password);
    if (!email || !password) {
      console.log('AuthController: Missing email or password in request body');
      throw new UnauthorizedException('Email and password are required');
    }
    try {
      const user = await this.authService.login(email, password);
      return user;
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; username?: string; firstName?: string; lastName?: string; birthday?: string }) {
    console.log('AuthController: Register request received:', registerDto);
    try {
      const user = await this.authService.register(registerDto);
      return user;
    } catch (error) {
      console.error('AuthController: Register error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    console.log('AuthController: Forgot password request received for email:', email);
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }
    try {
      const resetLink = await this.authService.forgotPassword(email);
      return { message: 'Password reset link sent (simulated)', resetLink };
    } catch (error) {
      console.error('AuthController: Forgot password error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('reset-password/:token')
  async resetPassword(@Body('newPassword') newPassword: string, @Body('token') token: string) {
    console.log('AuthController: Reset password request received with token:', token);
    if (!newPassword || !token) {
      throw new UnauthorizedException('New password and token are required');
    }
    try {
      await this.authService.resetPassword(token, newPassword);
      return { message: 'Password reset successful' };
    } catch (error) {
      console.error('AuthController: Reset password error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.authService.getCurrentUser(user.sub);
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
import { Controller, Post, Body, Get, UnauthorizedException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create-test-user')
  async createTestUser() {
    try {
      const user = await this.authService.createTestUser('eamonrivas@gmail.com', 'S7mR0!%uMZ<$[w%@');
      return { message: 'Test user created', user };
    } catch (error) {
      console.error('AuthController: Create test user error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log('AuthController: Login request received:', body);
    const { email, password } = body;
    console.log('AuthController: Extracted email:', email, 'password:', password);
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    try {
      const user = await this.authService.login(email, password);
      console.log('AuthController: Login successful, user:', user);
      return user;
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; username?: string; firstName?: string; lastName?: string; birthday?: string }) {
    console.log('AuthController: Register request received:', body);
    try {
      const user = await this.authService.register(body);
      console.log('AuthController: Register successful, user:', user);
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
      console.log('AuthController: Email is required for forgot password');
      throw new UnauthorizedException('Email is required');
    }
    try {
      const resetLink = await this.authService.forgotPassword(email);
      console.log('AuthController: Reset link generated:', resetLink);
      return { message: 'Password reset link sent (check console for link)', resetLink };
    } catch (error) {
      console.error('AuthController: Forgot password error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('reset-password/:token')
  async resetPassword(@Body('newPassword') newPassword: string, @Body('token') token: string) {
    console.log('AuthController: Reset password request received with token:', token, 'newPassword:', newPassword);
    if (!newPassword || !token) {
      console.log('AuthController: New password and token are required for reset password');
      throw new UnauthorizedException('New password and token are required');
    }
    try {
      await this.authService.resetPassword(token, newPassword);
      console.log('AuthController: Password reset successful');
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
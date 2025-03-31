import { Controller, Post, Body, Get, Query, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    const user = await this.authService.login(body.identifier, body.password);
    return { data: { user } };
  }

  @Post('register')
  async register(@Body() body: Partial<User>) {
    const user = await this.authService.register(body);
    return { user, message: 'Registration successful. Please check your email to verify your account.' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const user = await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully', user };
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    return await this.authService.recoverPassword(email);
  }

  @Put('reset')
  async reset(@Body() body: { token: string; newPassword: string }) {
    return await this.authService.resetPassword(body.token, body.newPassword);
  }
}
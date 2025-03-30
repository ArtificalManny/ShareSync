import { Controller, Post, Body, Get, Query } from '@nestjs/common';
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
    return { user };
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    const result = await this.authService.recoverPassword(email);
    return result;
  }

  @Post('reset')
  async reset(@Body() body: { token: string; newPassword: string }) {
    const result = await this.authService.resetPassword(body.token, body.newPassword);
    return result;
  }
}
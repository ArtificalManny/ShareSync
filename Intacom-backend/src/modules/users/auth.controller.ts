import { Controller, Post, Get, Put, Body, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    const user = await this.authService.validateUser(body.identifier, body.password);
    if (!user) throw new Error('Invalid credentials');
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    return this.authService.recover(email);
  }

  @Put('reset')
  async reset(@Body() body: { token: string; newPassword: string }) {
    return this.authService.reset(body.token, body.newPassword);
  }
}
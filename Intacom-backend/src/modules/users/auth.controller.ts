import { Controller, Post, Body, Get, Query, Put } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: any) {
    const user = await this.authService.register(userData);
    return { data: { user } }; // Wrap the user in a data field
  }

  @Post('login')
async login(@Body() loginData: { identifier: string; password: string }) {
  return this.authService.login(loginData.identifier, loginData.password);
}

  @Get('recover')
  async recover(@Query('email') email: string) {
    return this.authService.recover(email);
  }

  @Put('reset')
  async reset(@Body() resetData: { token: string; newPassword: string }) {
    return this.authService.reset(resetData.token, resetData.newPassword);
  }
}
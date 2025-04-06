import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { identifier: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.identifier, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() userData: any) {
    return this.authService.register(userData);
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    const { resetToken } = await this.authService.generateResetToken(email);
    // In a production environment, you would send an email with the reset link
    // For testing, we'll return the token directly
    return { message: 'Reset token generated', resetToken };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: { token: string; newPassword: string }) {
    return this.authService.resetPassword(resetDto.token, resetDto.newPassword);
  }
}
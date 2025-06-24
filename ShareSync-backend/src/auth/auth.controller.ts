// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')           // ← must be exactly 'auth'
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string }
  ) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(
    @Body() registerDto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }
  ) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; newPassword: string }
  ) {
    return this.authService.resetPassword(
      body.email,
      body.newPassword
    );
  }
}
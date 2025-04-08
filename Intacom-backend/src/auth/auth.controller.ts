import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { identifier: string; password: string }) {
    try {
      const user = await this.authService.validateUser(loginDto.identifier, loginDto.password);
      if (!user) {
        throw new HttpException('Invalid credentials', 401);
      }
      return this.authService.login(user);
    } catch (error) {
      throw new HttpException(error.message, error.status || 401);
    }
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || 400);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    try {
      return await this.authService.generateResetToken(email);
    } catch (error) {
      throw new HttpException(error.message, error.status || 400);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    try {
      return await this.authService.resetPassword(token, newPassword);
    } catch (error) {
      throw new HttpException(error.message, error.status || 400);
    }
  }
}
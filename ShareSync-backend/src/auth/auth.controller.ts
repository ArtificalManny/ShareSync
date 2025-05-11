import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: { email: string; username: string; password: string; firstName: string; lastName: string },
  ) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      return await this.authService.login(loginDto); // Pass single object
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    try {
      await this.authService.forgotPassword(email);
      return { message: 'Password reset link sent to your email.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: { token: string; newPassword: string }) {
    try {
      await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
      return { message: 'Password reset successfully.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
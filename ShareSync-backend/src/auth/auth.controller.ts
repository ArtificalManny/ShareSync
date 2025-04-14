import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);
    return {
      status: 'success',
      data: result,
    };
  }

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string; firstName: string; lastName: string },
  ) {
    const user = await this.authService.register(body);
    return {
      status: 'success',
      data: user,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
    return {
      status: 'success',
      message: 'Password reset link sent to your email.',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return {
      status: 'success',
      message: 'Password reset successfully.',
    };
  }

  @Post('logout')
  async logout() {
    // Since we're using JWT, logout is handled client-side by removing the token
    return {
      status: 'success',
      message: 'Logged out successfully.',
    };
  }
}
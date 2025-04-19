import { Controller, Post, Body, Get, UnauthorizedException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('AuthController: Login request received with DTO:', loginDto);
    const { email, password } = loginDto;
    console.log('AuthController: Extracted email:', email, 'password:', password);
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
  async register(@Body() body: any) {
    console.log('AuthController: Register request received:', body);
    const registerDto = {
      email: body.email,
      password: body.password,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      birthday: body.birthday,
    };
    console.log('AuthController: Register DTO:', registerDto);
    try {
      const user = await this.authService.register(registerDto);
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
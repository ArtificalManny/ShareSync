import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    try {
      return await this.authService.recover(email);
    } catch (error) {
      console.error('Error in recover:', error);
      throw error;
    }
  }

  @Post('reset')
  async reset(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(resetPasswordDto);
    } catch (error) {
      console.error('Error in reset:', error);
      throw error;
    }
  }
}
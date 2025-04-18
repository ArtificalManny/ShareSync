import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    console.log('AuthController: Login request received:', loginDto);
    try {
      const user = await this.authService.login(loginDto.email, loginDto.password);
      return { user };
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string }) {
    console.log('AuthController: Register request received:', registerDto);
    try {
      const user = await this.authService.register(registerDto.email, registerDto.password);
      return { user };
    } catch (error) {
      console.error('AuthController: Register error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
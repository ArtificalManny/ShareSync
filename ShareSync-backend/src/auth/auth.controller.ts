// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================
  // REGISTER (ENHANCED)
  // ============================================
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ============================================
  // LOGIN (Your existing + Enhanced)
  // ============================================
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    console.log('🔵 CONTROLLER RECEIVED:', body);
    console.log('🔵 Calling service with:', body.email, body.password?.length, 'chars');
    
    return this.authService.login(body.email, body.password);
  }

  // ============================================
  // REFRESH TOKEN (NEW)
  // ============================================
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@GetUser() user: any) {
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }

  // ============================================
  // LOGOUT (NEW)
  // ============================================
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser('_id') userId: string) {
    return this.authService.logout(userId);
  }

  // ============================================
  // GET CURRENT USER (NEW)
  // ============================================
  @Get('me')
  async getCurrentUser(@GetUser() user: any) {
    return user;
  }

  // ============================================
  // VERIFY TOKEN (Your existing - Keep it)
  // ============================================
  @Public()
  @Post('verify')
  verify(@Body() body: { token: string }) {
    try {
      const decoded = this.jwtService.verify(body.token, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      });
      return { valid: true, user: decoded };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
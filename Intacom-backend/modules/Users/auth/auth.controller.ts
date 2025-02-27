// auth.controller.ts

import {
    Controller,
    Post,
    Body,
    UnauthorizedException,
    UseGuards,
    Get,
    Req,
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { LoginUserDto } from '../users/dto/login-user.dto';
  import { RegisterUserDto } from '../users/dto/register-user.dto'; // If you have a DTO for registration
  import { JwtAuthGuard } from './jwt-auth.guard'; // If you have a JWT guard
  import { Request } from 'express';
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    /**
     * Login endpoint:
     * Validates user credentials, throws Unauthorized if invalid,
     * otherwise returns a token (or user data).
     */
    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto) {
      const user = await this.authService.validateUser(
        loginUserDto.email,
        loginUserDto.password,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      // Return JWT or session info
      return this.authService.login(user);
    }
  
    /**
     * (Optional) Register endpoint:
     * Creates a new user, then returns a token or user data.
     */
    @Post('register')
    async register(@Body() registerUserDto: RegisterUserDto) {
      const newUser = await this.authService.register(registerUserDto);
      return this.authService.login(newUser);
    }
  
    /**
     * (Optional) Me endpoint:
     * Returns the currently logged-in user's info, if authenticated.
     */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Req() req: Request) {
      return req.user; // or fetch user from DB if you need full data
    }
  }
  
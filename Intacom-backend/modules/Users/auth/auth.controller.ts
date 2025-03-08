import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Res() res: Response,
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('profilePic') profilePic?: string,
  ) {
    try {
      const user = await this.authService.register(username, password, profilePic);
      res.status(201).json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  @Post('login')
  async login(
    @Res() res: Response,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    try {
      const user = await this.authService.login(username, password);
      res.status(200).json({ user });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}
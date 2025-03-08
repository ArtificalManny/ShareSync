import { Controller, Post, Body, Res, Get, Put } from '@nestjs/common';
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
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('age') age: number,
    @Body('profilePic') profilePic?: string,
  ) {
    try {
      const user = await this.authService.register(username, password, email, name, age, profilePic);
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

  @Get('recover')
  async recoverPassword(
    @Res() res: Response,
    @Body('email') email: string,
  ) {
    try {
      const { message, token } = await this.authService.recoverPassword(email);
      res.status(200).json({ message, token });
      // In production, send token via email
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  @Put('reset')
  async resetPassword(
    @Res() res: Response,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    try {
      const user = await this.authService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Password reset successful', user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
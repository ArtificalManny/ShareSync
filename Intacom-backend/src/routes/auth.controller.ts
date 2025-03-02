import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }, @Res() res: Response) {
    const user = await this.authService.login(body.username, body.password);
    if (user) {
      res.cookie('userToken', JSON.stringify({ username: user.username, profilePic: user.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      res.json({ user, token: 'mock-token' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  @Post('register')
  async register(@Body() body: { username: string; password: string; profilePic?: string }, @Res() res: Response) {
    const newUser = await this.authService.register(body.username, body.password, body.profilePic);
    res.cookie('userToken', JSON.stringify({ username: newUser.username, profilePic: newUser.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json(newUser);
  }
}
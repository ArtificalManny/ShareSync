// src/auth/auth.controller.ts
import { Body, Controller, Post, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService, // used by /auth/verify
  ) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(body.email, body.password);

    // also set a cookie so requests without Authorization header still work
    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true behind HTTPS
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });

    return { token, user };
  }

  @Post('verify')
  verify(@Body() body: { token: string }) {
    try {
      const payload = this.jwt.verify(body.token, {
        secret: process.env.JWT_SECRET || 'dev_secret_please_change',
      });
      return { ok: true, payload };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
}

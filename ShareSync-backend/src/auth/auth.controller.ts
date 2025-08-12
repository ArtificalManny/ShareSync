import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  // ... your existing login/register etc.

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

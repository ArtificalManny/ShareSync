import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * DEV ONLY: Mint a JWT for a given userId.
 * Global prefix: app.setGlobalPrefix('api')
 * Route: GET /api/dev-auth/token?userId=...
 */
@Controller('dev-auth')
export class DevAuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get('token')
  async token(@Query('userId') userId?: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Not available in production');
    }

    if (!userId) {
      throw new UnauthorizedException('Missing userId');
    }

    // IMPORTANT: must be a real Mongo ObjectId string (24 hex chars)
    // and MUST NOT include angle brackets.
    const payload = { sub: userId, userId, id: userId };

    const secret =
      this.config.get<string>('JWT_SECRET') ||
      this.config.get<string>('ACCESS_TOKEN_SECRET') ||
      this.config.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Missing JWT secret (set JWT_SECRET in .env)');
    }

    const access_token = await this.jwt.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });

    return { success: true, access_token };
  }
}

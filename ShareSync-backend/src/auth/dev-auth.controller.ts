import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * DEV ONLY: Mint a JWT for a given userId.
 * Works with global prefix: app.setGlobalPrefix('api')
 * Route becomes: GET /api/dev-auth/token?userId=...
 */
@Controller('dev-auth')
export class DevAuthController {
  constructor(private readonly jwt: JwtService) {}

  @Get('token')
  async token(@Query('userId') userId?: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Not available in production');
    }

    if (!userId) {
      throw new UnauthorizedException('Missing userId');
    }

    // Make payload compatible with your mixed usage: sub/userId/id
    const payload = { sub: userId, userId, id: userId };

    return {
      success: true,
      access_token: await this.jwt.signAsync(payload),
    };
  }
}

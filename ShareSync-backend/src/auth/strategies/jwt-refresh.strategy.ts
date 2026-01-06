// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      'dev_refresh_secret_change_me_now';

    super({
      // IMPORTANT: if you truly send refresh tokens another way (cookie/header), change this extractor.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const authHeader = req.get('Authorization') || '';
    const refreshToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    return { ...payload, refreshToken };
  }
}

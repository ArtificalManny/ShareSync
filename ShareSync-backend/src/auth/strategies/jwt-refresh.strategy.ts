import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Minimal refresh strategy placeholder.
 * If you don't use refresh tokens yet, this keeps imports compiling.
 * Later: add separate secret + validate refresh token in DB/redis.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_secret_change_me',
    });
  }

  async validate(payload: any) {
    return payload;
  }
}

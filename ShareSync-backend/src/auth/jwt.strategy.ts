import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // looks at Authorization: Bearer <token>
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_please_change',
    });
  }

  async validate(payload: any) {
    // TEMP DEBUG: comment out after it works
    console.log('[jwt.validate] payload:', payload);
    return { sub: payload.sub, email: payload.email };
  }
}
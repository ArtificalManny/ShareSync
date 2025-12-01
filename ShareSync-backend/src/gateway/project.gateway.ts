//Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/gateway/project.gateway.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

function fromCookie(name: string) {
  return (req: Request) => {
    try {
      // @ts-ignore
      const v = req?.cookies?.[name];
      return typeof v === 'string' && v.length > 0 ? v : null;
    } catch {
      return null;
    }
  };
}

function fromAuthHeader(req: Request) {
  const h = req?.headers?.authorization;
  if (!h) return null;
  const [scheme, token] = String(h).split(' ');
  if (/^bearer$/i.test(scheme) && token) return token;
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromAuthHeader,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
        fromCookie('accessToken'),
        fromCookie('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_change_me',
    });
  }

  async validate(payload: any) {
    // Normalize to a consistent shape the rest of the app can rely on
    // Many JWTs use `sub` for user id. Keep `id` and `_id` mirrors too.
    return {
      sub: payload.sub || payload.id || payload._id,
      id: payload.sub || payload.id || payload._id,
      _id: payload.sub || payload.id || payload._id,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}

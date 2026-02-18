import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const secret =
      config.get<string>('JWT_SECRET') ||
      config.get<string>('ACCESS_TOKEN_SECRET') ||
      config.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      // This will surface immediately on boot if secret is missing
      throw new UnauthorizedException('JWT secret missing (set JWT_SECRET)');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Whatever your app expects as "user id"
    return payload;
  }
}

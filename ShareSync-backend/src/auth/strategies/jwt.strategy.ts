// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'dev_secret_change_me_now';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

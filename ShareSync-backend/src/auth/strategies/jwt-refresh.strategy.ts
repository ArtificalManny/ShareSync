import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      configService.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'dev_refresh_secret_change_me_now';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromBodyField('refresh_token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const id = String(payload?.sub || payload?.userId || payload?.id || '');
    const user = await this.authService.validateUserById(id);
    if (!user) throw new UnauthorizedException();
    return { ...user, userId: String((user as any)?._id || id) };
  }
}

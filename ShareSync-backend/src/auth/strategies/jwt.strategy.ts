import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_change_me',
    });
  }

  async validate(payload: any) {
    const userId = String(payload?.sub || payload?.userId || payload?.id || '');

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    // Important:
    // This reloads the user from MongoDB on protected requests.
    // AuthService.validateUserById() now enforces accountStatus, so banned,
    // disabled, or currently suspended users are blocked even if they already
    // had a valid JWT before enforcement happened.
    const user = await this.authService.validateUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...payload,
      ...(user as any),
      sub: userId,
      userId,
      id: userId,
      roles: (user as any).roles || payload?.roles || [],
      accountStatus: (user as any).accountStatus || 'active',
    };
  }
}

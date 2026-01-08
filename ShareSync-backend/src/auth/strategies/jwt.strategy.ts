// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'dev_secret_change_me_now';

    console.log('🔑🔑🔑 JWT STRATEGY CONSTRUCTOR CALLED 🔑🔑🔑');
    console.log('🔑 Secret from ConfigService:', configService.get<string>('JWT_SECRET')?.substring(0, 10) + '...');
    console.log('🔑 Secret from process.env:', process.env.JWT_SECRET?.substring(0, 10) + '...');
    console.log('🔑 Final secret being used:', secret.substring(0, 15) + '...');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    
    console.log('🔑 JWT Strategy fully initialized!');
  }

  async validate(payload: any) {
    console.log('🔍🔍🔍 VALIDATE CALLED! 🔍🔍🔍');
    console.log('🔍 Payload:', JSON.stringify(payload, null, 2));
    
    const id = String(payload?.sub || payload?.userId || payload?.id || '');
    console.log('🔍 Extracted ID:', id);
    
    const user = await this.authService.validateUserById(id);
    console.log('🔍 User found:', !!user, user ? 'ID: ' + (user as any)?._id : 'NULL');

    if (!user) {
      console.log('❌❌❌ THROWING UNAUTHORIZED - NO USER ❌❌❌');
      throw new UnauthorizedException();
    }

    console.log('✅✅✅ VALIDATION SUCCESS ✅✅✅');
    
    // CRITICAL FIX: Include 'sub' field that controllers expect!
    return { 
      ...user, 
      sub: id,  // ← ADD THIS!
      userId: String((user as any)?._id || id) 
    };
  }
}

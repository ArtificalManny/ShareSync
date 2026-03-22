// src/auth/strategies/google.strategy.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH 2.0 STRATEGY
// Handles the Google sign-in flow via Passport
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:5050/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const googleProfile = {
      googleId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      profilePicture: photos?.[0]?.value || '',
    };

    console.log('🔵 GOOGLE STRATEGY: Validating profile for', googleProfile.email);

    try {
      const user = await this.authService.validateOrCreateGoogleUser(googleProfile);
      done(null, user);
    } catch (err) {
      console.error('❌ GOOGLE STRATEGY: Validation failed:', err.message);
      done(err, null);
    }
  }
}

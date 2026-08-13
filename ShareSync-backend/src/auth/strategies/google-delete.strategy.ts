import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleDeleteStrategy extends PassportStrategy(
  Strategy,
  'google-delete',
) {
  constructor(configService: ConfigService) {
    const normalCallbackUrl = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:5050/api/auth/google/callback',
    );

    const deleteCallbackUrl =
      configService.get<string>('GOOGLE_DELETE_CALLBACK_URL') ||
      normalCallbackUrl.replace(
        /\/google\/callback\/?$/,
        '/google/delete/callback',
      );

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: deleteCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const googleId = String(profile?.id || '').trim();

    if (!googleId) {
      return done(new Error('Google identity was not returned'), null);
    }

    // google-account-delete-reauth-v1
    // IMPORTANT: identity verification only.
    // Do not call validateOrCreateGoogleUser() here.
    return done(null, { googleId });
  }
}

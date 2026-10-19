import { randomBytes } from 'crypto';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { requireValidatedJwtSecret } from './jwt-secret-validation';

describe('V2G1-R2A validated authentication JWT secret', () => {
  const validSecret = randomBytes(48).toString('base64url');

  const configurationError =
    'JWT_SECRET configuration is missing or insecure';

  function mockConfig(secret: unknown): ConfigService {
    return {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return secret;
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return undefined;
      }),
    } as unknown as ConfigService;
  }

  function authJwtFactory(): (config: ConfigService) => any {
    const imports: any[] =
      Reflect.getMetadata(
        MODULE_METADATA.IMPORTS,
        AuthModule,
      ) || [];

    const registration = imports.find(
      (entry: any) =>
        entry?.module === JwtModule &&
        Array.isArray(entry.providers),
    );

    if (!registration) {
      throw new Error('Auth JWT module registration missing');
    }

    const provider = registration.providers.find(
      (entry: any) =>
        typeof entry?.useFactory === 'function' &&
        Array.isArray(entry.inject) &&
        entry.inject.includes(ConfigService),
    );

    if (!provider) {
      throw new Error('Auth JWT factory missing');
    }

    return provider.useFactory;
  }

  it('returns a valid configured secret unchanged', () => {
    expect(requireValidatedJwtSecret(validSecret)).toBe(
      validSecret,
    );
  });

  it('rejects a missing secret', () => {
    expect(() => requireValidatedJwtSecret(undefined))
      .toThrow(configurationError);
  });

  it('rejects a blank secret', () => {
    expect(() => requireValidatedJwtSecret(''))
      .toThrow(configurationError);
  });

  it('rejects a short secret', () => {
    expect(() => requireValidatedJwtSecret('short'))
      .toThrow(configurationError);
  });

  it('rejects a padded known insecure fallback', () => {
    expect(() =>
      requireValidatedJwtSecret(
        'dev_secret_change_me'.padEnd(48, 'X'),
      ),
    ).toThrow(configurationError);
  });

  it('rejects an obviously repetitive secret', () => {
    expect(() =>
      requireValidatedJwtSecret('A'.repeat(64)),
    ).toThrow(configurationError);
  });

  it('constructs the active JWT strategy with a valid secret', () => {
    const config = mockConfig(validSecret);

    expect(() =>
      new JwtStrategy({} as AuthService, config),
    ).not.toThrow();

    expect(config.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('fails closed when the strategy secret is missing', () => {
    expect(() =>
      new JwtStrategy(
        {} as AuthService,
        mockConfig(undefined),
      ),
    ).toThrow(configurationError);
  });

  it('fails closed on an unsafe strategy secret', () => {
    expect(() =>
      new JwtStrategy(
        {} as AuthService,
        mockConfig('dev_secret_change_me'),
      ),
    ).toThrow(configurationError);
  });

  it('uses the configured secret in AuthModule JWT options', () => {
    const options = authJwtFactory()(mockConfig(validSecret));

    expect(options.secret).toBe(validSecret);
    expect(options.signOptions.expiresIn).toBe('7d');
  });

  it('rejects a missing secret in the AuthModule factory', () => {
    expect(() =>
      authJwtFactory()(mockConfig(undefined)),
    ).toThrow(configurationError);
  });

  it('rejects an unsafe secret in the AuthModule factory', () => {
    expect(() =>
      authJwtFactory()(
        mockConfig('dev_secret_change_me'),
      ),
    ).toThrow(configurationError);
  });
});

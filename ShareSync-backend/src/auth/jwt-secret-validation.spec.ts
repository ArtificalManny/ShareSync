import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateJwtSecretEnvironment } from './jwt-secret-validation';

describe('V2G1-R1 JWT secret configuration validation', () => {
  const message = 'JWT_SECRET configuration is missing or insecure';

  const validSecret = randomBytes(48).toString('base64url');

  function validate(value: unknown) {
    return validateJwtSecretEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: value,
    });
  }

  it('rejects missing JWT_SECRET', () => {
    expect(() => validateJwtSecretEnvironment({
      NODE_ENV: 'production',
    })).toThrow(message);
  });

  it('rejects null JWT_SECRET', () => {
    expect(() => validate(null)).toThrow(message);
  });

  it('rejects non-string JWT_SECRET', () => {
    expect(() => validate(123456)).toThrow(message);
  });

  it('rejects an empty JWT_SECRET', () => {
    expect(() => validate('')).toThrow(message);
  });

  it('rejects whitespace-only JWT_SECRET', () => {
    expect(() => validate(' '.repeat(64))).toThrow(message);
  });

  it('rejects secrets shorter than 32 characters', () => {
    expect(() => validate('Short-Signing-Secret-123')).toThrow(message);
  });

  it('rejects leading and trailing whitespace', () => {
    expect(() => validate(` ${validSecret} `)).toThrow(message);
  });

  it('rejects the original known development fallback', () => {
    expect(() => validate('dev_secret_change_me')).toThrow(message);
  });

  it('rejects padded versions of the original fallback', () => {
    expect(() =>
      validate('dev_secret_change_me'.padEnd(48, 'X')),
    ).toThrow(message);
  });

  it('rejects padded legacy ShareSync defaults', () => {
    expect(() =>
      validate('sharesync-secret'.padEnd(48, 'X')),
    ).toThrow(message);
  });

  it('rejects an obviously repetitive signing key', () => {
    expect(() => validate('A'.repeat(64))).toThrow(message);
  });

  it('accepts a sufficiently long generated secret', () => {
    expect(() => validate(validSecret)).not.toThrow();
  });

  it('returns the original configuration without modifications', () => {
    const configuration = {
      NODE_ENV: 'production',
      JWT_SECRET: validSecret,
      JWT_EXPIRES_IN: '7d',
      OTHER_SETTING: 'preserved',
    };

    expect(
      validateJwtSecretEnvironment(configuration),
    ).toBe(configuration);
  });

  it('is wired into the global configuration module', () => {
    const source = readFileSync(
      join(__dirname, '../app.module.ts'),
      'utf8',
    );

    expect(source).toContain(
      "from './auth/jwt-secret-validation'",
    );

    expect(source).toContain(
      'validate: validateJwtSecretEnvironment',
    );

    expect(source).toContain(
      "envFilePath: ['.env.local', '.env']",
    );
  });
});

import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtService } from '@nestjs/jwt';
import { requireValidatedJwtSecret } from './jwt-secret-validation';

describe('V2G1-R2B1 JWT signing and verification', () => {
  const secret = randomBytes(48).toString('base64url');

  const service = readFileSync(
    join(__dirname, 'auth.service.ts'),
    'utf8',
  );

  const controller = readFileSync(
    join(__dirname, 'auth.controller.ts'),
    'utf8',
  );

  const expectedSecretExpression =
    'secret: requireValidatedJwtSecret(process.env.JWT_SECRET),';

  const count = (source: string, needle: string) =>
    source.split(needle).length - 1;

  const jwt = new JwtService({});

  it('uses the validated secret twice in AuthService', () => {
    expect(count(service, expectedSecretExpression)).toBe(2);
  });

  it('uses the validated secret four times in AuthController', () => {
    expect(count(controller, expectedSecretExpression)).toBe(4);
  });

  it('removes the development fallback from AuthService', () => {
    expect(service).not.toContain('dev_secret_change_me');
  });

  it('removes the development fallback from AuthController', () => {
    expect(controller).not.toContain('dev_secret_change_me');
  });

  it('preserves the access-token expiration setting', () => {
    expect(service).toContain("expiresIn: '7d'");
  });

  it('preserves Google OAuth and deletion-state expirations', () => {
    expect(controller).toContain("expiresIn: '7d'");
    expect(controller).toContain("expiresIn: '5m'");
    expect(controller).toContain(
      "purpose: 'account-delete-google'",
    );
  });

  it('retains asynchronous and synchronous verification paths', () => {
    expect(controller).toContain(
      'this.jwtService.verifyAsync(state, {',
    );

    expect(controller).toContain(
      'this.jwtService.verify(body.token, {',
    );
  });

  it('returns the same valid signing key', () => {
    expect(requireValidatedJwtSecret(secret)).toBe(secret);
  });

  it('rejects a missing signing key', () => {
    expect(() =>
      requireValidatedJwtSecret(undefined),
    ).toThrow(
      'JWT_SECRET configuration is missing or insecure',
    );
  });

  it('rejects the known development signing key', () => {
    expect(() =>
      requireValidatedJwtSecret('dev_secret_change_me'),
    ).toThrow(
      'JWT_SECRET configuration is missing or insecure',
    );
  });

  it('signs and verifies a seven-day access token', async () => {
    const resolved = requireValidatedJwtSecret(secret);

    const token = await jwt.signAsync(
      { sub: 'test-user', username: 'sample' },
      { secret: resolved, expiresIn: '7d' },
    );

    const decoded = await jwt.verifyAsync(token, {
      secret: resolved,
    });

    expect(decoded).toMatchObject({
      sub: 'test-user',
      username: 'sample',
    });

    expect(decoded.exp - decoded.iat).toBe(604800);
  });

  it('verifies a five-minute deletion state and rejects another key', async () => {
    const resolved = requireValidatedJwtSecret(secret);

    const state = await jwt.signAsync(
      {
        sub: 'test-user',
        purpose: 'account-delete-google',
      },
      {
        secret: resolved,
        expiresIn: '5m',
      },
    );

    const decoded = await jwt.verifyAsync(state, {
      secret: resolved,
    });

    expect(decoded.purpose).toBe('account-delete-google');
    expect(decoded.exp - decoded.iat).toBe(300);

    const otherSecret = randomBytes(48).toString('base64url');

    await expect(
      jwt.verifyAsync(state, {
        secret: requireValidatedJwtSecret(otherSecret),
      }),
    ).rejects.toThrow();
  });
});

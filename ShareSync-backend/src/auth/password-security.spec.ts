import * as bcrypt from 'bcrypt';

import {
  PASSWORD_BCRYPT_COST,
  hashPassword,
  isBcryptPasswordHash,
  verifyPasswordHash,
} from './password-security';

describe('Password security foundation', () => {
  const password = 'OpenShare-test-only-password-123!';

  it('hashes passwords using bcrypt cost 12', async () => {
    const hash = await hashPassword(password);

    expect(isBcryptPasswordHash(hash)).toBe(true);
    expect(bcrypt.getRounds(hash)).toBe(PASSWORD_BCRYPT_COST);
    expect(hash).not.toBe(password);
  });

  it('generates different salted hashes for identical passwords', async () => {
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toBe(second);
    expect(await verifyPasswordHash(password, first)).toBe(true);
    expect(await verifyPasswordHash(password, second)).toBe(true);
  });

  it('verifies correct passwords and rejects incorrect passwords', async () => {
    const hash = await hashPassword(password);

    expect(await verifyPasswordHash(password, hash)).toBe(true);

    expect(
      await verifyPasswordHash('incorrect-test-password', hash),
    ).toBe(false);
  });

  it('remains compatible with existing bcrypt cost 10 hashes', async () => {
    const legacyHash = await bcrypt.hash(password, 10);

    expect(bcrypt.getRounds(legacyHash)).toBe(10);

    expect(
      await verifyPasswordHash(password, legacyHash),
    ).toBe(true);
  });

  it('rejects plaintext stored passwords', async () => {
    expect(
      await verifyPasswordHash(password, password),
    ).toBe(false);

    expect(isBcryptPasswordHash(password)).toBe(false);
  });

  it('rejects invalid and missing stored hashes', async () => {
    expect(await verifyPasswordHash(password, '')).toBe(false);
    expect(await verifyPasswordHash(password, null)).toBe(false);
    expect(await verifyPasswordHash(password, undefined)).toBe(false);

    expect(
      await verifyPasswordHash(password, 'not-a-valid-hash'),
    ).toBe(false);
  });

  it('rejects passwords longer than 72 UTF-8 bytes', async () => {
    await expect(
      hashPassword('x'.repeat(73)),
    ).rejects.toThrow('72 UTF-8 bytes');

    await expect(
      hashPassword(String.fromCodePoint(0x1F600).repeat(19)),
    ).rejects.toThrow('72 UTF-8 bytes');
  });

  it('accepts passwords at the 72-byte boundary', async () => {
    const passwordAtLimit = 'x'.repeat(72);
    const hash = await hashPassword(passwordAtLimit);

    expect(
      await verifyPasswordHash(passwordAtLimit, hash),
    ).toBe(true);
  });

  it('rejects empty new passwords', async () => {
    await expect(hashPassword('')).rejects.toThrow(
      'A non-empty password is required',
    );
  });
});

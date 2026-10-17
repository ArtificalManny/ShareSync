import * as bcrypt from 'bcrypt';

/**
 * Shared password-hashing policy.
 *
 * bcrypt generates a unique random salt for each new hash.
 * Existing bcrypt hashes remain verifiable at their original cost.
 *
 * IMPORTANT:
 * Do not use this utility to hash email addresses, API credentials,
 * or other values the application must recover.
 */

export const PASSWORD_BCRYPT_COST = 12;

const BCRYPT_HASH_PATTERN =
  /^\$2[aby]\$(0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}$/;

/**
 * Recognize the encoded bcrypt hash format.
 *
 * This must not accept plaintext passwords as stored hashes.
 */
export function isBcryptPasswordHash(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    BCRYPT_HASH_PATTERN.test(value)
  );
}

/**
 * Hash a newly supplied password.
 *
 * bcrypt includes a random salt and work factor in the returned hash.
 */
export async function hashPassword(
  password: string,
): Promise<string> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('A non-empty password is required');
  }

  // bcrypt silently ignores password bytes beyond the first 72.
  // Reject oversized new passwords rather than truncating them.
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new RangeError(
      'bcrypt passwords must be at most 72 UTF-8 bytes',
    );
  }

  return bcrypt.hash(password, PASSWORD_BCRYPT_COST);
}

/**
 * Verify an existing bcrypt password hash.
 *
 * Invalid formats fail closed. Plaintext fallback is not permitted.
 *
 * This function is not yet wired into the production login flow.
 */
export async function verifyPasswordHash(
  password: string,
  storedHash: unknown,
): Promise<boolean> {
  if (
    typeof password !== 'string' ||
    !isBcryptPasswordHash(storedHash)
  ) {
    return false;
  }

  try {
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

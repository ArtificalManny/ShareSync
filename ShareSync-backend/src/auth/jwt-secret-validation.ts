/**
 * Primary JWT-secret startup validation.
 *
 * This checks minimum configuration safety. It does not establish
 * cryptographic entropy or rotate an existing signing key.
 *
 * Never include the configured secret in errors or diagnostic logs.
 */

const CONFIGURATION_ERROR =
  'JWT_SECRET configuration is missing or insecure';

const KNOWN_UNSAFE_MARKERS = [
  'dev_secret_change_me',
  'dev_jwt_secret_change_me',
  'dev_refresh_secret_change_me_now',
  'sharesync-secret',
  'change_me',
  'changeme',
  'replace_me',
  'your_secret',
  'example_secret',
  'placeholder',
];

export function validateJwtSecretEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const secret = environment.JWT_SECRET;

  if (
    typeof secret !== 'string' ||
    secret.length < 32 ||
    secret !== secret.trim()
  ) {
    throw new Error(CONFIGURATION_ERROR);
  }

  const normalized = secret.toLowerCase();

  if (
    KNOWN_UNSAFE_MARKERS.some((marker) =>
      normalized.includes(marker),
    ) ||
    new Set(secret).size < 8
  ) {
    throw new Error(CONFIGURATION_ERROR);
  }

  return environment;
}

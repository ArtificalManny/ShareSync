// src/utils/resolveDisplayName.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 6.1 + 6.2: Single source of truth for user display name resolution
//
// Fallback priority (NEVER returns "User"):
//   1. displayName / name / fullName
//   2. firstName + lastName (from multiple possible field locations)
//   3. username / handle
//   4. email.split('@')[0]
//   5. "Anonymous" (absolute last resort — NOT "User")
//
// Used by: Profile.jsx, Sidebar.jsx, Discover feed, any component showing a name
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve a user object into { firstName, lastName, fullName, initials }.
 * Handles every known shape of user data across the app.
 *
 * @param {Object|null|undefined} user - User object from API, auth context, or localStorage
 * @returns {{ firstName: string, lastName: string, fullName: string, initials: string }}
 */
export function resolveDisplayName(user) {
  if (!user || typeof user !== 'object') {
    return { firstName: '', lastName: '', fullName: 'Anonymous', initials: '?' };
  }

  // ── Step 1: Extract first/last from all possible field locations ────────
  const first = pickFirst([
    user.firstName,
    user.firstname,
    user.givenName,
    user.given_name,
    user.profile?.firstName,
    user.profile?.givenName,
  ]);

  const last = pickFirst([
    user.lastName,
    user.lastname,
    user.familyName,
    user.family_name,
    user.profile?.lastName,
    user.profile?.familyName,
  ]);

  const fullFromParts = joinParts(first, last);

  // ── Step 2: Check pre-composed full name fields ────────────────────────
  const preComposed = pickFirst([
    user.displayName,
    user.display_name,
    user.name,
    user.fullName,
    user.full_name,
    user.profile?.displayName,
    user.profile?.name,
    user.profile?.fullName,
  ]);

  // ── Step 3: Username / handle fallback ─────────────────────────────────
  const usernameFallback = pickFirst([
    user.username,
    user.handle,
    user.profile?.username,
  ]);

  // ── Step 4: Email prefix fallback ──────────────────────────────────────
  const emailPrefix = extractEmailPrefix(user.email || user.profile?.email);

  // ── Step 5: Assemble final name ────────────────────────────────────────
  // Priority: parts > preComposed > username > email > "Anonymous"
  // We prefer parts because they give us separate first/last for forms/avatars
  const fullName =
    fullFromParts ||
    sanitizeName(preComposed) ||
    sanitizeName(usernameFallback) ||
    sanitizeName(emailPrefix) ||
    'Anonymous';

  // Derive first name for greeting contexts
  const resolvedFirst = first || splitFirstWord(preComposed) || splitFirstWord(usernameFallback) || splitFirstWord(emailPrefix) || '';
  const resolvedLast = last || '';

  // Initials for avatar
  const initials = buildInitials(resolvedFirst, resolvedLast, fullName);

  return {
    firstName: resolvedFirst,
    lastName: resolvedLast,
    fullName,
    initials,
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────

/**
 * Return the first truthy, non-empty, non-"User" string from candidates
 */
function pickFirst(candidates) {
  for (const val of candidates) {
    const s = typeof val === 'string' ? val.trim() : '';
    if (s && s.toLowerCase() !== 'user' && s.toLowerCase() !== 'demo user') {
      return s;
    }
  }
  return '';
}

/**
 * Join first + last, filtering empties
 */
function joinParts(first, last) {
  return [first, last].filter(Boolean).join(' ').trim();
}

/**
 * Sanitize a name string — reject "User", "Demo User", empty, etc.
 */
function sanitizeName(val) {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return '';
  if (lower === 'user' || lower === 'demo user' || lower === 'undefined' || lower === 'null') return '';
  return trimmed;
}

/**
 * Extract email prefix: "manny@gmail.com" → "manny"
 */
function extractEmailPrefix(email) {
  if (!email || typeof email !== 'string') return '';
  const at = email.indexOf('@');
  if (at <= 0) return '';
  return email.slice(0, at).trim();
}

/**
 * Get first word of a string: "Manny Rivas" → "Manny"
 */
function splitFirstWord(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().split(/\s+/)[0] || '';
}

/**
 * Build 1-2 character initials
 */
function buildInitials(first, last, fullName) {
  if (first && last) {
    return (first[0] + last[0]).toUpperCase();
  }
  if (first) {
    return first[0].toUpperCase();
  }
  if (fullName && fullName !== 'Anonymous') {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return '?';
}

export default resolveDisplayName;

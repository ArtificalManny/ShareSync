#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/api/users.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_users_search_api] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = '''import client from "./client";

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;

  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const id = String(user._id || user.id || user.userId || user.username || "").trim();
  if (!id) return null;

  const firstName = user.firstName || user.givenName || "";
  const lastName = user.lastName || user.familyName || "";
  const displayName =
    user.displayName ||
    user.name ||
    `${firstName} ${lastName}`.trim() ||
    user.username ||
    "User";

  return {
    ...user,
    _id: user._id || user.id || user.userId || id,
    id,
    firstName,
    lastName,
    displayName,
    name: displayName,
    username: user.username || user.handle || "",
    avatarUrl:
      user.avatarUrl ||
      user.profilePicture ||
      user.avatar ||
      user.photoUrl ||
      user.profile?.avatarUrl ||
      user.profile?.photoUrl ||
      null,
  };
}

export async function fetchMe() {
  const res = await client.get("/users/me");
  return res.data;
}

export async function fetchActivitySummary() {
  const res = await client.get("/users/activity-summary");
  return res.data;
}

export async function fetchPublicProfile(username) {
  const res = await client.get(`/users/public/${encodeURIComponent(username)}`);
  return res.data;
}

export async function fetchUserActivity(userId, limit = 80) {
  const res = await client.get(`/users/${userId}/activity`, {
    params: { limit },
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH GLOBAL USERS
// ─────────────────────────────────────────────────────────────────────────────
export async function searchGlobalUsers(query, limit = 20) {
  const q = String(query || "").trim();
  if (!q || q.length < 2) return [];

  try {
    const res = await client.get("/users/search", {
      params: { q, limit },
    });

    const users = unwrapArray(res?.data)
      .map(normalizeUser)
      .filter(Boolean);

    return users;
  } catch (err) {
    console.error("[users] searchGlobalUsers failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONE VERIFICATION API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends the user's phone number to the backend to trigger a Twilio SMS code.
 * @param {string} phoneNumber - The phone number to verify (e.g., "+1234567890")
 */
export async function sendPhoneVerificationCode(phoneNumber) {
  const res = await client.post("/notifications/channels/sms/start", { phoneNumber });
  return res.data;
}

/**
 * Submits the 6-digit code entered by the user to the backend for Twilio verification.
 * ⭐ FIX: Now accepts and sends BOTH phoneNumber and code!
 * @param {string} phoneNumber - The phone number being verified.
 * @param {string} code - The 6-digit SMS verification code.
 */
export async function verifyPhoneCode(phoneNumber, code) {
  const res = await client.post("/notifications/channels/sms/verify", { phoneNumber, code });
  return res.data;
}
'''


def main():
    print("[harden_users_search_api] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        'import client from "./client";',
        "export async function fetchMe()",
        "export async function fetchActivitySummary()",
        "export async function fetchPublicProfile(username)",
        "export async function fetchUserActivity(userId, limit = 80)",
        "export async function searchGlobalUsers(query)",
        'client.get(`/users/search?q=${encodeURIComponent(query)}`)',
        "export async function sendPhoneVerificationCode(phoneNumber)",
        "export async function verifyPhoneCode(phoneNumber, code)",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before rewrite: {marker}")

    required_after = [
        "function unwrapArray(payload)",
        "function normalizeUser(user)",
        "export async function searchGlobalUsers(query, limit = 20)",
        'const res = await client.get("/users/search", {',
        "params: { q, limit },",
        "unwrapArray(res?.data)",
        ".map(normalizeUser)",
        'console.error("[users] searchGlobalUsers failed:", err);',
        "export async function sendPhoneVerificationCode(phoneNumber)",
        "export async function verifyPhoneCode(phoneNumber, code)",
    ]

    for marker in required_after:
        if marker not in NEW_CONTENT:
            fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[harden_users_search_api] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-user-search-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_users_search_api] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[harden_users_search_api] patched: {TARGET}")

    print("")
    print("[harden_users_search_api] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"unwrapArray|normalizeUser|searchGlobalUsers|/users/search|displayName|avatarUrl\" src/api/users.js -C 8")
    print("  git diff -- src/api/users.js")


if __name__ == "__main__":
    main()

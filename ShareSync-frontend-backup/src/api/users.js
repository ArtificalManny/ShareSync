import client from "./client";

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
// PHONE VERIFICATION API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends the user's phone number to the backend to trigger a Twilio SMS code.
 * @param {string} phoneNumber - The phone number to verify (e.g., "+1234567890")
 */
export async function sendPhoneVerificationCode(phoneNumber) {
  const res = await client.post("/users/me/phone/send-code", { phoneNumber });
  return res.data;
}

/**
 * Submits the 6-digit code entered by the user to the backend for Twilio verification.
 * @param {string} code - The 6-digit SMS verification code.
 */
export async function verifyPhoneCode(code) {
  const res = await client.post("/users/me/phone/verify-code", { code });
  return res.data;
}

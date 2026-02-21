import client from "./client";

// Me
export async function getMe() {
  const { data } = await client.get("/users/me"); // -> /api/users/me
  return data;
}

// Public profile
export async function getPublicUser(username) {
  const { data } = await client.get(`/users/public/${encodeURIComponent(username)}`);
  return data;
}

// PATCH profile (JSON)
export async function updateProfile(patch) {
  const { data } = await client.patch("/users/me", patch);
  return data;
}

// PATCH notifications
export async function updateNotifications(patch) {
  const { data } = await client.patch("/users/me/notifications", patch);
  return data;
}

/**
 * Avatar upload (multipart)
 * - No backend changes required; we TRY common endpoints.
 * - If your backend supports one of these, it will work immediately.
 *
 * Tries (in order):
 *   POST /users/me/avatar   field: avatar
 *   POST /users/me/avatar   field: profilePicture
 *   PATCH /users/me/avatar  field: avatar
 *   PATCH /users/me         field: avatar (multipart)
 *
 * Returns: whatever backend returns (user or { avatarUrl } etc.)
 */
export async function uploadMyAvatar(file) {
  if (!file) throw new Error("No file selected.");

  const form1 = new FormData();
  form1.append("avatar", file);

  const form2 = new FormData();
  form2.append("profilePicture", file);

  // Helper that throws if fails
  async function tryReq(fn) {
    try {
      const res = await fn();
      return res?.data;
    } catch (e) {
      return null;
    }
  }

  // Try common patterns without changing backend
  const attempts = [
    () => client.post("/users/me/avatar", form1, { headers: { "Content-Type": "multipart/form-data" } }),
    () => client.post("/users/me/avatar", form2, { headers: { "Content-Type": "multipart/form-data" } }),
    () => client.patch("/users/me/avatar", form1, { headers: { "Content-Type": "multipart/form-data" } }),
    () => client.patch("/users/me", form1, { headers: { "Content-Type": "multipart/form-data" } }),
    () => client.patch("/users/me", form2, { headers: { "Content-Type": "multipart/form-data" } }),
  ];

  for (const a of attempts) {
    const out = await tryReq(a);
    if (out) return out;
  }

  const err = new Error("Avatar upload endpoint not available (frontend-only fallback used).");
  err.code = "AVATAR_UPLOAD_UNAVAILABLE";
  throw err;
}

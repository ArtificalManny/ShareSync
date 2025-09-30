// Axios instance already base'd to /api and has auth interceptors
import client from "./client";

/** Get the signed-in user's profile */
export async function getMe() {
  const { data } = await client.get("/users/me");
  return data;
}

/** Patch profile fields (name, bio, username, prefs, etc.) */
export async function updateProfile(patch = {}) {
  const { data } = await client.patch("/users/me", patch);
  return data;
}

/**
 * Update avatar via image file/blob OR via emoji string.
 * - If passed a File/Blob: uploads to /uploads/avatar, then PATCH /users/me
 * - If passed a string: stores as avatarEmoji (and clears avatarUrl)
 *
 * Returns: { avatarUrl?, avatarEmoji?, avatarVersion? }
 */
export async function updateAvatar(fileOrEmoji) {
  // Emoji path (simple text like "😄" or ":rocket:")
  if (typeof fileOrEmoji === "string") {
    const { data } = await client.patch("/users/me", {
      avatarEmoji: fileOrEmoji,
      avatarUrl: null,
      // bump version so UIs bust caches even when switching to emoji
      avatarVersion: Date.now(),
    });
    return {
      avatarEmoji: data?.avatarEmoji || fileOrEmoji,
      avatarUrl: null,
      avatarVersion: data?.avatarVersion,
    };
  }

  // File/Blob path
  if (fileOrEmoji && typeof fileOrEmoji === "object") {
    const fd = new FormData();
    fd.append("avatar", fileOrEmoji);
    const up = await client.post("/uploads/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const rawUrl = up?.data?.url || up?.data?.avatarUrl;
    if (!rawUrl) throw new Error("Upload did not return a URL.");

    const version = Date.now(); // cache buster for CDNs
    await client.patch("/users/me", {
      avatarUrl: rawUrl,
      avatarEmoji: null,
      avatarVersion: version,
      blurhash: up?.data?.blurhash,
    });

    return { avatarUrl: rawUrl, avatarEmoji: null, avatarVersion: version };
  }

  throw new Error("updateAvatar requires a File/Blob or an emoji string.");
}

/** List earned and discoverable badges for the signed-in user */
export async function listBadges() {
  try {
    const { data } = await client.get("/users/me/badges");
    return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  } catch {
    // Fallback (older servers): try /users/badges
    try {
      const { data } = await client.get("/users/badges");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}

/** Recent “highlights” (milestones, completed tasks, sprints) */
export async function listHighlights() {
  try {
    const { data } = await client.get("/users/me/highlights");
    return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function searchUsers(query, opts = {}) {
    const params = { q: String(query || '').trim(), limit: opts.limit ?? 8 }
    const { data } = await client.get('/users/search', { params });
    //Expext { items: [...] }, but be tolerant of arrays
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

export default {
  getMe,
  updateProfile,
  updateAvatar,
  listBadges,
  listHighlights,
  searchUsers,
};

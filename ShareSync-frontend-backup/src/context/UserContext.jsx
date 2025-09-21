// /src/context/UserContext.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSocket from "../hooks/useSocket";

export const UserContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: (_u) => {},
  updateUser: (_patch) => {},
  refresh: () => Promise.resolve(),
});

const API = import.meta.env.VITE_API_URL || "";
const USER_STORAGE_KEY = "sharesync.user.v1";
const USER_POKE_KEY = `${USER_STORAGE_KEY}:poke`;

/* ──────────────────────────────────────────────────────────────────────────
   Local cache helpers
────────────────────────────────────────────────────────────────────────── */
function readUserCache() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function minimalUser(u) {
  if (!u) return null;
  return {
    _id: u._id || u.id,
    id: u._id || u.id,
    username: u.username,
    firstName: u.firstName || u.name,
    lastName: u.lastName,
    profilePicture: u.profilePicture,
    avatarVersion: u.avatarVersion, // optional version for cache-busting
    publicProfile: u.publicProfile,
    updatedAt: u.updatedAt || Date.now(),
  };
}

function writeUserCache(u) {
  try {
    if (!u) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(minimalUser(u)));
  } catch {
    /* ignore */
  }
}

/* Append/refresh ?v= to bust image cache across tabs */
function versionedAvatarUrl(url, version) {
  const clean = String(url || "");
  if (!clean) return clean;
  const v = version || Date.now();
  // Replace existing ?v= if present, else append
  if (clean.includes("?")) {
    const [base, qs] = clean.split("?");
    const params = new URLSearchParams(qs);
    params.set("v", String(v));
    return `${base}?${params.toString()}`;
  }
  return `${clean}?v=${v}`;
}

/* Merge server/socket payloads with current user, ensure avatar cache-bust */
function mergeUser(prev, next) {
  if (!prev) return next ? minimalUser(next) : null;
  if (!next) return null;
  const merged = { ...prev, ...next };

  // Normalize id fields
  merged._id = merged._id || merged.id;
  merged.id = merged._id || merged.id;

  // If profilePicture changed (or avatarVersion provided), bump the URL query
  if (next.profilePicture || next.avatarVersion) {
    const base = next.profilePicture || prev.profilePicture;
    const v = next.avatarVersion || Date.now();
    merged.profilePicture = versionedAvatarUrl(base, v);
    merged.avatarVersion = v;
  }

  return minimalUser(merged);
}

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => readUserCache());
  const [loading, setLoading] = useState(true);

  // NOTE: token read once for boot; refresh() will handle auth failures by clearing it.
  const tokenRef = useRef(localStorage.getItem("token") || "");

  const broadcast = useCallback((nextUser) => {
    // 1) intra-tab
    window.dispatchEvent(
      new CustomEvent("user:updated", { detail: { user: nextUser } })
    );
    // 2) cross-tab
    try {
      localStorage.setItem(USER_POKE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  const setUser = useCallback(
    (next) => {
      const normalized = next ? mergeUser(null, next) : null;
      setUserState(normalized);
      writeUserCache(normalized);
      broadcast(normalized);
      // Optional global for legacy consumers
      try {
        window.__SS_USER = normalized ? { ...normalized } : null;
      } catch {}
    },
    [broadcast]
  );

  const updateUser = useCallback(
    (patch) => {
      setUserState((prev) => {
        const merged = mergeUser(prev, patch || {});
        writeUserCache(merged);
        // Broadcast outside setState to ensure listeners get latest value immediately
        setTimeout(() => broadcast(merged), 0);
        try {
          window.__SS_USER = merged ? { ...merged } : null;
        } catch {}
        return merged;
      });
    },
    [broadcast]
  );

  const refresh = useCallback(async () => {
    const token = tokenRef.current || localStorage.getItem("token") || "";
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("[UserContext] refresh failed:", err);
      // auth failure → clear token + user
      try {
        localStorage.removeItem("token");
      } catch {}
      tokenRef.current = "";
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  // Initial hydrate → quick cache, then fetch fresh if authed
  useEffect(() => {
    const token = localStorage.getItem("token");
    tokenRef.current = token || "";
    if (!token) {
      setLoading(false);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for same-tab “user:updated” custom events (e.g., AvatarUploader success)
  useEffect(() => {
    const onUserUpdated = (e) => {
      const next = e?.detail?.user;
      if (!next) return;
      setUserState((prev) => {
        const merged = mergeUser(prev, next);
        writeUserCache(merged);
        try {
          window.__SS_USER = merged ? { ...merged } : null;
        } catch {}
        return merged;
      });
    };
    window.addEventListener("user:updated", onUserUpdated);
    return () => window.removeEventListener("user:updated", onUserUpdated);
  }, []);

  // Cross-tab sync via storage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === USER_STORAGE_KEY && e.newValue) {
        try {
          const cached = JSON.parse(e.newValue);
          setUserState(cached);
          try {
            window.__SS_USER = cached ? { ...cached } : null;
          } catch {}
        } catch {
          /* ignore */
        }
      }
      if (e.key === USER_POKE_KEY) {
        const cached = readUserCache();
        if (cached) {
          setUserState(cached);
          try {
            window.__SS_USER = cached ? { ...cached } : null;
          } catch {}
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     Realtime: join `user:{id}` room and apply socket "user:updated" payloads
     (Your backend already emits this in a few places.)
  ───────────────────────────────────────────────────────────────────────── */
  const userRoom = user?._id ? `user:${user._id}` : null;

  useSocket(userRoom, {
    onEvents: {
      "user:updated": (payload) => {
        // payload may include firstName/lastName/username/profilePicture/bio/avatarVersion
        updateUser(payload || {});
      },
    },
  });

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      setUser,      // overwrite user entirely (e.g., after /me)
      updateUser,   // shallow merge patch (e.g., after PATCH /users/me or socket push)
      refresh,      // refetch from server
    }),
    [user, loading, setUser, updateUser, refresh]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;

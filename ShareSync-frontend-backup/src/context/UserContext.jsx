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

const API_RAW = import.meta.env.VITE_API_URL || "";
const API = String(API_RAW).replace(/\/+$/, ""); // trim trailing slashes
const USER_STORAGE_KEY = "sharesync.user.v1";
const USER_POKE_KEY = `${USER_STORAGE_KEY}:poke`;

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
    avatarVersion: u.avatarVersion,
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
  } catch {}
}

function versionedAvatarUrl(url, version) {
  const clean = String(url || "");
  if (!clean) return clean;
  const v = version || Date.now();
  if (clean.includes("?")) {
    const [base, qs] = clean.split("?");
    const params = new URLSearchParams(qs);
    params.set("v", String(v));
    return `${base}?${params.toString()}`;
  }
  return `${clean}?v=${v}`;
}

function mergeUser(prev, next) {
  if (!prev) return next ? minimalUser(next) : null;
  if (!next) return null;
  const merged = { ...prev, ...next };
  merged._id = merged._id || merged.id;
  merged.id = merged._id || merged.id;
  if (next.profilePicture || next.avatarVersion) {
    const base = next.profilePicture || prev.profilePicture;
    const v = next.avatarVersion || Date.now();
    merged.profilePicture = versionedAvatarUrl(base, v);
    merged.avatarVersion = v;
  }
  return minimalUser(merged);
}

function getTokenAny() {
  try {
    return (
      localStorage.getItem("ss.jwt") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  } catch {
    return "";
  }
}

function buildMeUrl() {
  // Supports either:
  // API="http://localhost:5050"      -> "http://localhost:5050/api/users/me"
  // API="http://localhost:5050/api"  -> "http://localhost:5050/api/users/me"
  if (!API) return "/api/users/me";
  const endsWithApi = /\/api$/.test(API);
  return endsWithApi ? `${API}/users/me` : `${API}/api/users/me`;
}

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => readUserCache());
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(getTokenAny());

  const broadcast = useCallback((nextUser) => {
    window.dispatchEvent(
      new CustomEvent("user:updated", { detail: { user: nextUser } })
    );
    try {
      localStorage.setItem(USER_POKE_KEY, String(Date.now()));
    } catch {}
  }, []);

  const setUser = useCallback(
    (next) => {
      const normalized = next ? mergeUser(null, next) : null;
      setUserState(normalized);
      writeUserCache(normalized);
      broadcast(normalized);
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
    const token = tokenRef.current || getTokenAny();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(buildMeUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`);
      const data = await res.json();

      // Some backends wrap responses: { success, data }
      const payload = data?.data ?? data;
      setUser(payload);
    } catch (err) {
      console.error("[UserContext] refresh failed:", err);
      try {
        localStorage.removeItem("ss.jwt");
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
      } catch {}
      tokenRef.current = "";
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    const token = getTokenAny();
    tokenRef.current = token || "";
    if (!token) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

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

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === USER_STORAGE_KEY && e.newValue) {
        try {
          const cached = JSON.parse(e.newValue);
          setUserState(cached);
          try {
            window.__SS_USER = cached ? { ...cached } : null;
          } catch {}
        } catch {}
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

  const userRooms = useMemo(() => {
    return user?._id ? [`user:${user._id}`] : [];
  }, [user?._id]);

  const socketEvents = useMemo(
    () => ({
      "user:updated": (payload) => updateUser(payload || {}),
    }),
    [updateUser]
  );

  useSocket(userRooms, {
    onEvents: socketEvents,
    enabled: true,
    userId: user?._id || null,
  });

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      setUser,
      updateUser,
      refresh,
    }),
    [user, loading, setUser, updateUser, refresh]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;

// /src/context/NotesContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * NotesContext
 * - Lightweight Quick Notes layer.
 * - Persists to localStorage.
 * - IMPORTANT: storage is scoped per authenticated user/account.
 *
 * Why:
 * The old key, "sharesync.notes.v1", was shared by every account in the same
 * browser profile. That made demo@sharesync.io notes appear under other users
 * in Chrome. This v2 implementation isolates notes by current user identity.
 */

const LEGACY_STORAGE_KEY = "sharesync.notes.v1";
const STORAGE_PREFIX = "sharesync.notes.v2";

const USER_STORAGE_CANDIDATES = [
  "ss.user",
  "sharesync.user",
  "user",
  "auth.user",
  "currentUser",
];

const TOKEN_STORAGE_CANDIDATES = ["accessToken", "token", "authToken"];

const NotesContext = createContext({
  notes: /** @type {Array<Note>} */ ([]),
  activeNoteId: /** @type {string|null} */ (null),
  lastEditedAt: /** @type {number|null} */ (null),

  createNote: (_partial) => "",
  updateNote: (_id, _partial) => {},
  deleteNote: (_id) => {},
  pinNote: (_id, _pinned = true) => {},
  setActiveNote: (_id) => {},
  clearAll: () => {},

  getActiveNote: () => null,
  search: (_query) => [],
});

export const useNotes = () => useContext(NotesContext);

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {boolean} pinned
 * @property {number} createdAt
 * @property {number} updatedAt
 */

const now = () => Date.now();

const genId = () =>
  `n_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeGetItem(key) {
  try {
    if (!canUseLocalStorage()) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota/privacy errors */
  }
}

function safeParseJSON(value) {
  try {
    if (!value || typeof value !== "string") return null;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return window.atob(padded);
  } catch {
    return "";
  }
}

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return safeParseJSON(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

function unwrapUserCandidate(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  if (parsed.user && typeof parsed.user === "object") return parsed.user;
  if (parsed.data?.user && typeof parsed.data.user === "object") return parsed.data.user;
  if (parsed.profile && typeof parsed.profile === "object") return parsed.profile;
  if (parsed.data && typeof parsed.data === "object") return parsed.data;

  return parsed;
}

function sanitizeStoragePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/gi, "_")
    .slice(0, 160);
}

function pickIdentityFromObject(obj) {
  if (!obj || typeof obj !== "object") return "";

  const candidates = [
    obj.email,
    obj._id,
    obj.id,
    obj.userId,
    obj.sub,
    obj.username,
    obj.name,
  ];

  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  return found ? sanitizeStoragePart(found) : "";
}

function getCurrentNotesIdentity() {
  if (!canUseLocalStorage()) return "anonymous";

  for (const key of USER_STORAGE_CANDIDATES) {
    const parsed = safeParseJSON(safeGetItem(key));
    const user = unwrapUserCandidate(parsed);
    const identity = pickIdentityFromObject(user);
    if (identity) return identity;
  }

  for (const key of TOKEN_STORAGE_CANDIDATES) {
    const payload = decodeJwtPayload(safeGetItem(key));
    const identity = pickIdentityFromObject(payload);
    if (identity) return identity;
  }

  return "anonymous";
}

function buildStorageKey(identity) {
  return `${STORAGE_PREFIX}.${sanitizeStoragePart(identity || "anonymous")}`;
}

function normalizeNote(note) {
  if (!note || typeof note !== "object") return null;

  const id = typeof note.id === "string" && note.id.trim() ? note.id : genId();
  const createdAt = Number.isFinite(Number(note.createdAt))
    ? Number(note.createdAt)
    : now();
  const updatedAt = Number.isFinite(Number(note.updatedAt))
    ? Number(note.updatedAt)
    : createdAt;

  return {
    id,
    title: typeof note.title === "string" ? note.title : "",
    content: typeof note.content === "string" ? note.content : "",
    pinned: Boolean(note.pinned),
    createdAt,
    updatedAt,
  };
}

function normalizeState(parsed) {
  const rawNotes = Array.isArray(parsed?.notes) ? parsed.notes : [];
  const notes = rawNotes.map(normalizeNote).filter(Boolean);

  const activeNoteId =
    typeof parsed?.activeNoteId === "string" &&
    notes.some((note) => note.id === parsed.activeNoteId)
      ? parsed.activeNoteId
      : null;

  const lastEditedAt = Number.isFinite(Number(parsed?.lastEditedAt))
    ? Number(parsed.lastEditedAt)
    : null;

  return { notes, activeNoteId, lastEditedAt };
}

function emptyState() {
  return { notes: [], activeNoteId: null, lastEditedAt: null };
}

function loadStateForKey(storageKey) {
  const parsed = safeParseJSON(safeGetItem(storageKey));
  if (!parsed) return emptyState();
  return normalizeState(parsed);
}

function saveStateForKey(storageKey, state) {
  saveStateToLocalStorage(storageKey, state);
}

function saveStateToLocalStorage(storageKey, state) {
  safeSetItem(storageKey, JSON.stringify(state));
}

function createInitialProviderState() {
  const identity = getCurrentNotesIdentity();
  const storageKey = buildStorageKey(identity);
  const state = loadStateForKey(storageKey);

  return {
    identity,
    storageKey,
    ...state,
  };
}

export function NotesProvider({ children }) {
  const initialRef = useRef(null);

  if (!initialRef.current) {
    initialRef.current = createInitialProviderState();
  }

  const [storageIdentity, setStorageIdentity] = useState(initialRef.current.identity);
  const [hydratedStorageKey, setHydratedStorageKey] = useState(
    initialRef.current.storageKey
  );
  const [notes, setNotes] = useState(initialRef.current.notes);
  const [activeNoteId, setActiveNoteId] = useState(initialRef.current.activeNoteId);
  const [lastEditedAt, setLastEditedAt] = useState(initialRef.current.lastEditedAt);

  const storageKey = useMemo(
    () => buildStorageKey(storageIdentity),
    [storageIdentity]
  );

  const refreshIdentity = useCallback(() => {
    const nextIdentity = getCurrentNotesIdentity();
    setStorageIdentity((current) =>
      current === nextIdentity ? current : nextIdentity
    );
  }, []);

  const hydrateFromStorageKey = useCallback((key) => {
    const next = loadStateForKey(key);
    setNotes(next.notes);
    setActiveNoteId(next.activeNoteId);
    setLastEditedAt(next.lastEditedAt);
    setHydratedStorageKey(key);
  }, []);

  // When the logged-in account changes, switch to that account's note bucket.
  useEffect(() => {
    if (hydratedStorageKey === storageKey) return;
    hydrateFromStorageKey(storageKey);
  }, [storageKey, hydratedStorageKey, hydrateFromStorageKey]);

  // Persist notes only after the correct account bucket has been hydrated.
  useEffect(() => {
    if (hydratedStorageKey !== storageKey) return;

    saveStateForKey(storageKey, {
      notes,
      activeNoteId,
      lastEditedAt,
    });
  }, [storageKey, hydratedStorageKey, notes, activeNoteId, lastEditedAt]);

  // Cross-tab sync + account-switch detection.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const authKeys = new Set([
      ...USER_STORAGE_CANDIDATES,
      ...TOKEN_STORAGE_CANDIDATES,
    ]);

    const handleStorage = (event) => {
      if (event.key === storageKey) {
        hydrateFromStorageKey(storageKey);
        return;
      }

      if (event.key && authKeys.has(event.key)) {
        refreshIdentity();
      }
    };

    const handleFocus = () => refreshIdentity();

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshIdentity();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [storageKey, hydrateFromStorageKey, refreshIdentity]);

  // Same-tab login/logout changes do not fire the browser storage event.
  // This lightweight poll catches account switches without touching backend logic.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const id = window.setInterval(refreshIdentity, 1000);
    return () => window.clearInterval(id);
  }, [refreshIdentity]);

  // Debug helper for verifying account isolation in DevTools.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.__debugQuickNotesScope = () => ({
      identity: storageIdentity,
      storageKey,
      hydratedStorageKey,
      noteCount: notes.length,
      notes,
      legacyKey: LEGACY_STORAGE_KEY,
      legacyStillExists: Boolean(safeGetItem(LEGACY_STORAGE_KEY)),
    });

    return () => {
      try {
        delete window.__debugQuickNotesScope;
      } catch {}
    };
  }, [storageIdentity, storageKey, hydratedStorageKey, notes]);

  const createNote = useCallback((partial = {}) => {
    const id = genId();
    const t = now();

    const note = {
      id,
      title: String(partial.title ?? "").trim(),
      content: String(partial.content ?? "").trim(),
      pinned: Boolean(partial.pinned ?? false),
      createdAt: t,
      updatedAt: t,
    };

    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(id);
    setLastEditedAt(t);

    return id;
  }, []);

  const updateNote = useCallback((id, partial = {}) => {
    setNotes((prev) => {
      const exists = prev.some((note) => note.id === id);
      if (!exists) return prev;

      const t = now();
      setLastEditedAt(t);

      return prev.map((note) =>
        note.id === id
          ? {
              ...note,
              title:
                partial.title !== undefined ? String(partial.title) : note.title,
              content:
                partial.content !== undefined
                  ? String(partial.content)
                  : note.content,
              updatedAt: t,
            }
          : note
      );
    });
  }, []);

  const deleteNote = useCallback((id) => {
    const t = now();

    setNotes((prev) => prev.filter((note) => note.id !== id));
    setActiveNoteId((current) => (current === id ? null : current));
    setLastEditedAt(t);
  }, []);

  const pinNote = useCallback((id, pinned = true) => {
    const t = now();

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, pinned: Boolean(pinned), updatedAt: t } : note
      )
    );
    setLastEditedAt(t);
  }, []);

  const setActiveNote = useCallback((id) => {
    setActiveNoteId(typeof id === "string" && id.trim() ? id : null);
  }, []);

  const clearAll = useCallback(() => {
    setNotes([]);
    setActiveNoteId(null);
    setLastEditedAt(null);
  }, []);

  const getActiveNote = useCallback(() => {
    if (!activeNoteId) return null;
    return notes.find((note) => note.id === activeNoteId) ?? null;
  }, [activeNoteId, notes]);

  const search = useCallback(
    (query) => {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return notes;

      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q)
      );
    },
    [notes]
  );

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes]);

  const value = useMemo(
    () => ({
      notes: sortedNotes,
      activeNoteId,
      lastEditedAt,

      createNote,
      updateNote,
      deleteNote,
      pinNote,
      setActiveNote,
      clearAll,

      getActiveNote,
      search,
    }),
    [
      sortedNotes,
      activeNoteId,
      lastEditedAt,
      createNote,
      updateNote,
      deleteNote,
      pinNote,
      setActiveNote,
      clearAll,
      getActiveNote,
      search,
    ]
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

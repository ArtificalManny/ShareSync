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
   * - Serious, lightweight notes layer that persists to localStorage.
   * - CRUD, pin/unpin, last-edited tracking, active note selection.
   * - Cross-tab sync + stable IDs.
   */
  
  const STORAGE_KEY = "sharesync.notes.v1";
  
  const NotesContext = createContext({
    notes: /** @type {Array<Note>} */ ([]),
    activeNoteId: /** @type {string|null} */ (null),
    lastEditedAt: /** @type {number|null} */ (null),
  
    // actions
    createNote: (_partial) => "",
    updateNote: (_id, _partial) => {},
    deleteNote: (_id) => {},
    pinNote: (_id, _pinned = true) => {},
    setActiveNote: (_id) => {},
    clearAll: () => {},
  
    // helpers
    getActiveNote: () => null,
    search: (_query) => [],
  });
  
  export const useNotes = () => useContext(NotesContext);
  
  // ---- Types (JSDoc for intellisense) ----
  /**
   * @typedef {Object} Note
   * @property {string} id
   * @property {string} title
   * @property {string} content
   * @property {boolean} pinned
   * @property {number} createdAt  // epoch ms
   * @property {number} updatedAt  // epoch ms
   */
  
  // ---- Internal helpers ----
  const now = () => Date.now();
  const genId = () =>
    `n_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
  
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
  
      const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
      const activeNoteId =
        typeof parsed.activeNoteId === "string" ? parsed.activeNoteId : null;
      const lastEditedAt =
        typeof parsed.lastEditedAt === "number" ? parsed.lastEditedAt : null;
  
      return { notes, activeNoteId, lastEditedAt };
    } catch {
      return null;
    }
  }
  
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota/privacy errors */
    }
  }
  
  const initialState = () =>
    loadState() ?? { notes: /** @type {Note[]} */ ([]), activeNoteId: null, lastEditedAt: null };
  
  // ---- Provider ----
  export function NotesProvider({ children }) {
    const [notes, setNotes] = useState(initialState().notes);
    const [activeNoteId, setActiveNoteId] = useState(initialState().activeNoteId);
    const [lastEditedAt, setLastEditedAt] = useState(initialState().lastEditedAt);
  
    const stateRef = useRef({ notes, activeNoteId, lastEditedAt });
    useEffect(() => {
      stateRef.current = { notes, activeNoteId, lastEditedAt };
      saveState(stateRef.current);
    }, [notes, activeNoteId, lastEditedAt]);
  
    // cross-tab sync
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        const parsed = loadState();
        if (!parsed) return;
        setNotes(parsed.notes);
        setActiveNoteId(parsed.activeNoteId);
        setLastEditedAt(parsed.lastEditedAt);
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);
  
    // ---- Actions ----
    const createNote = useCallback((partial = {}) => {
      const id = genId();
      const t = now();
      /** @type {Note} */
      const note = {
        id,
        title: (partial.title ?? "").trim(),
        content: (partial.content ?? "").trim(),
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
        const t = now();
        const next = prev.map((n) =>
          n.id === id
            ? {
                ...n,
                title:
                  partial.title !== undefined ? String(partial.title) : n.title,
                content:
                  partial.content !== undefined
                    ? String(partial.content)
                    : n.content,
                updatedAt: t,
              }
            : n
        );
        setLastEditedAt(t);
        return next;
      });
    }, []);
  
    const deleteNote = useCallback((id) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setActiveNoteId((curr) => (curr === id ? null : curr));
    }, []);
  
    const pinNote = useCallback((id, pinned = true) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, pinned, updatedAt: now() } : n))
      );
    }, []);
  
    const setActiveNote = useCallback((id) => {
      setActiveNoteId(id);
    }, []);
  
    const clearAll = useCallback(() => {
      setNotes([]);
      setActiveNoteId(null);
      setLastEditedAt(null);
    }, []);
  
    // ---- Helpers ----
    const getActiveNote = useCallback(() => {
      if (!activeNoteId) return null;
      return notes.find((n) => n.id === activeNoteId) ?? null;
    }, [activeNoteId, notes]);
  
    const search = useCallback(
      (query) => {
        const q = String(query || "").trim().toLowerCase();
        if (!q) return notes;
        return notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        );
      },
      [notes]
    );
  
    // derived: sort pinned first, then by updatedAt desc
    const sortedNotes = useMemo(() => {
      return [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }, [notes]);
  
    const value = {
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
    };
  
    return (
      <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
    );
  }
  
// /src/context/PinnedContext.jsx
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
   * PinnedContext
   * - Global store for pinned items (tasks, docs, links, etc.)
   * - Persisted in localStorage + cross-tab synced
   * - Stable, minimal metadata for fast rendering and deep linking
   *
   * Item shape:
   * {
   *   id: string,              // stable id of the underlying entity (e.g., task _id)
   *   kind: 'task'|'doc'|'link'|'other',
   *   title: string,
   *   href?: string,           // optional deep link route/hash
   *   projectId?: string,
   *   meta?: Record<string, any>,
   *   addedAt: number          // epoch ms
   * }
   */
  
  const STORAGE_KEY = "sharesync.pinned.v1";
  
  const PinnedContext = createContext({
    items: /** @type {PinnedItem[]} */ ([]),
  
    // actions
    pin: (_item) => {},
    unpin: (_id) => {},
    toggle: (_item) => {},
    updateMeta: (_id, _partialMeta) => {},
    clearAll: () => {},
  
    // helpers
    isPinned: (_id) => false,
    get: (_id) => null,
    byKind: (_kind) => /** @type {PinnedItem[]} */ ([]),
  });
  
  export const usePinned = () => useContext(PinnedContext);
  
  // ---------- Types (JSDoc) ----------
  /**
   * @typedef {Object} PinnedItem
   * @property {string} id
   * @property {'task'|'doc'|'link'|'other'} kind
   * @property {string} title
   * @property {string=} href
   * @property {string=} projectId
   * @property {Record<string, any>=} meta
   * @property {number} addedAt
   */
  
  // ---------- Helpers ----------
  const now = () => Date.now();
  
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota/privacy */
    }
  }
  
  // ---------- Provider ----------
  export function PinnedProvider({ children }) {
    const [items, setItems] = useState(() => load());
    const ref = useRef(items);
  
    useEffect(() => {
      ref.current = items;
      save(items);
    }, [items]);
  
    // cross-tab sync
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        try {
          const next = JSON.parse(e.newValue);
          if (Array.isArray(next)) setItems(next);
        } catch {
          /* ignore */
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);
  
    // ---------- Actions ----------
    const pin = useCallback((item) => {
      // require minimal fields
      if (!item || !item.id || !item.title) return;
      const normalized = {
        id: String(item.id),
        kind: item.kind || "other",
        title: String(item.title),
        href: item.href || undefined,
        projectId: item.projectId || undefined,
        meta: item.meta || undefined,
        addedAt: item.addedAt || now(),
      };
      setItems((prev) => {
        const exists = prev.find((p) => p.id === normalized.id);
        if (exists) {
          // update fields but keep original addedAt
          return prev.map((p) =>
            p.id === normalized.id
              ? { ...p, ...normalized, addedAt: p.addedAt }
              : p
          );
        }
        return [normalized, ...prev];
      });
    }, []);
  
    const unpin = useCallback((id) => {
      setItems((prev) => prev.filter((p) => p.id !== String(id)));
    }, []);
  
    const toggle = useCallback((item) => {
      const targetId = String(item?.id ?? "");
      if (!targetId) return;
      setItems((prev) => {
        const exists = prev.some((p) => p.id === targetId);
        if (exists) return prev.filter((p) => p.id !== targetId);
        const normalized = {
          id: targetId,
          kind: item.kind || "other",
          title: String(item.title || "Untitled"),
          href: item.href || undefined,
          projectId: item.projectId || undefined,
          meta: item.meta || undefined,
          addedAt: now(),
        };
        return [normalized, ...prev];
      });
    }, []);
  
    const updateMeta = useCallback((id, partialMeta = {}) => {
      setItems((prev) =>
        prev.map((p) =>
          p.id === String(id)
            ? { ...p, meta: { ...(p.meta || {}), ...partialMeta } }
            : p
        )
      );
    }, []);
  
    const clearAll = useCallback(() => setItems([]), []);
  
    // ---------- Helpers ----------
    const isPinned = useCallback(
      (id) => items.some((p) => p.id === String(id)),
      [items]
    );
  
    const get = useCallback(
      (id) => items.find((p) => p.id === String(id)) || null,
      [items]
    );
  
    const byKind = useCallback(
      (kind) => items.filter((p) => p.kind === kind),
      [items]
    );
  
    // sort: newest first, tasks before others (optional)
    const sorted = useMemo(() => {
      return [...items].sort((a, b) => {
        if (a.kind !== b.kind) {
          // prioritize tasks, then docs, then links/other
          const order = { task: 0, doc: 1, link: 2, other: 3 };
          return (order[a.kind] ?? 99) - (order[b.kind] ?? 99);
        }
        return b.addedAt - a.addedAt;
      });
    }, [items]);
  
    const value = {
      items: sorted,
      pin,
      unpin,
      toggle,
      updateMeta,
      clearAll,
      isPinned,
      get,
      byKind,
    };
  
    return (
      <PinnedContext.Provider value={value}>{children}</PinnedContext.Provider>
    );
  }
  
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";

/** Build query string from params */
function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Read token if present (public feed won’t need it) */
function getToken() {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      undefined
    );
  } catch {
    return undefined;
  }
}

/** Pure, memoized feed item — only re-renders if its relevant fields change */
const FeedItem = memo(
  function FeedItem({ item }) {
    const tsLabel = useMemo(() => {
      const d = new Date(item.timestamp || item.createdAt || Date.now());
      return d.toLocaleString();
    }, [item.timestamp, item.createdAt]);

    // Copy-only: show "cadence" for type "streak" without changing data
    const displayType = item.type === "streak" ? "cadence" : item.type;

    return (
      <article
        className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 p-4"
        aria-label={item.title || item.message || displayType}
      >
        <header className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {item.username || item.name || "User"}
          </div>
          <div className="text-xs text-slate-500">
            {displayType} • {tsLabel}
          </div>
        </header>

        {item.message && (
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {item.message}
          </p>
        )}

        <footer className="mt-2 text-xs text-slate-500">
          {!!item.replyCount && <span className="mr-3">💬 {item.replyCount}</span>}
          {!!item.reactionCount && <span>👍 {item.reactionCount}</span>}
        </footer>
      </article>
    );
  },
  // Custom compare to avoid re-render unless important fields changed
  (prev, next) => {
    const a = prev.item;
    const b = next.item;
    return (
      String(a._id || a.id) === String(b._id || b.id) &&
      a.reactionCount === b.reactionCount &&
      a.replyCount === b.replyCount &&
      a.message === b.message &&
      a.type === b.type &&
      a.username === b.username &&
      a.createdAt === b.createdAt &&
      a.timestamp === b.timestamp
    );
  }
);

/** Small chip component (memoized) */
const Chip = memo(function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      }`}
    >
      {children}
    </button>
  );
});

export default function PublicStreakFeed({
  initialType = "all",
  initialSince = "7d",
  initialSort = "newest",
  pageSize = 20,
}) {
  const [type, setType] = useState(initialType);
  const [since, setSince] = useState(initialSince);
  const [sort, setSort] = useState(initialSort);

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");
  const [end, setEnd] = useState(false);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const abortRef = useRef(null);

  // Keep API route name (server expects "streak-feed")
  const urlBase = "/api/streak-feed";

  const listKeyed = useMemo(
    () =>
      items.map((it) => ({
        key: String(it._id || it.id),
        item: it,
      })),
    [items]
  );

  const url = useMemo(() => {
    return (
      urlBase +
      qs({
        type: type === "all" ? undefined : type,
        since,
        sort,
        limit: pageSize,
        cursor,
      })
    );
  }, [type, since, sort, pageSize, cursor]);

  const resetAndLoad = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setItems([]);
    setCursor(undefined);
    setEnd(false);
    setError("");
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(
        urlBase +
          qs({
            type: type === "all" ? undefined : type,
            since,
            sort,
            limit: pageSize,
          }),
        {
          credentials: "include",
          signal: abortRef.current.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const next = Array.isArray(data?.items) ? data.items : [];
      setItems(next);
      setCursor(data?.nextCursor);
      setEnd(!data?.nextCursor);
      setError("");
    } catch (e) {
      setError("Failed to load feed.");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [type, since, sort, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || end) return;
    if (!cursor) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(url, {
        credentials: "include",
        signal: abortRef.current.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const next = Array.isArray(data?.items) ? data.items : [];
      const seen = new Set(items.map((it) => String(it._id || it.id)));
      const merged = items.concat(
        next.filter((it) => !seen.has(String(it._id || it.id)))
      );
      setItems(merged);

      setCursor(data?.nextCursor);
      setEnd(!data?.nextCursor);
    } catch (e) {
      setError("Failed to load more.");
    } finally {
      setLoading(false);
    }
  }, [url, items, loading, end, cursor]);

  // Initial + when filters/sort change
  useEffect(() => {
    resetAndLoad();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [resetAndLoad]);

  // IntersectionObserver: auto-load when sentinel becomes visible
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (!sentinelRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          if (!loading && !end && cursor) {
            loadMore();
          }
        }
      },
      { rootMargin: "200px 0px" }
    );

    observerRef.current = obs;
    obs.observe(sentinelRef.current);

    return () => {
      obs.disconnect();
      observerRef.current = null;
    };
  }, [cursor, end, loading, loadMore]);

  // Stable handlers for chips (prevents re-renders of memo chips)
  const onType = useCallback((t) => setType(t), []);
  const onSince = useCallback((s) => setSince(s), []);
  const onSort = useCallback((s) => setSort(s), []);

  return (
    <div className="space-y-4">
      {/* Header copy (Cadence) */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Public Cadence Feed
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Recent activity across public projects. Cadence reflects how
          consistently teams are making progress.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "streak", "levelUp", "taskComplete"].map((t) => (
          <Chip key={t} active={type === t} onClick={() => onType(t)}>
            {t === "all" ? "All" : t === "streak" ? "Cadence" : t}
          </Chip>
        ))}

        <div className="mx-2" />

        {["24h", "7d", "30d", "all"].map((s) => (
          <Chip key={s} active={since === s} onClick={() => onSince(s)}>
            {s}
          </Chip>
        ))}

        <div className="mx-2" />

        {[
          { key: "newest", label: "Newest" },
          { key: "top", label: "Top" },
        ].map((s) => (
          <Chip
            key={s.key}
            active={sort === s.key}
            onClick={() => onSort(s.key)}
          >
            {s.label}
          </Chip>
        ))}
      </div>

      {/* Error (with retry) */}
      {!!error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 p-3 text-rose-700 dark:text-rose-300 flex items-center justify-between"
        >
          <span className="mr-3">{error}</span>
          <button
            onClick={() => (initialLoaded ? loadMore() : resetAndLoad())}
            disabled={loading}
            className={`underline px-3 py-1 rounded-full ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Retrying" : "Retry"}
          </button>
        </div>
      )}

      {/* Empty */}
      {initialLoaded && !loading && items.length === 0 && !error && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            No activity yet
          </div>
          <div className="text-slate-500 mt-1">
            Try different filters or check back later.
          </div>
          <div className="mt-4">
            <button
              onClick={resetAndLoad}
              className="px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* List (memo items) */}
      <div className="grid grid-cols-1 gap-3">
        {listKeyed.map(({ key, item }) => (
          <FeedItem key={key} item={item} />
        ))}
      </div>

      {loading && (
        <div className="text-center text-sm text-slate-500">Loading…</div>
      )}

      <div ref={sentinelRef} />

      {!loading && !end && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            className="mt-2 px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
          >
            Load more
          </button>
        </div>
      )}

      {!loading && end && items.length > 0 && (
        <div className="text-center text-xs text-slate-400 my-2">
          End of feed
        </div>
      )}
    </div>
  );
}
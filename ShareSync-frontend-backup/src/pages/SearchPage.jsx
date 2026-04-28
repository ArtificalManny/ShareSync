// /src/pages/SearchPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Folder, CheckCircle2, User as UserIcon, MessageSquare, File as FileIcon } from "lucide-react";
import { searchAll } from "../api/search";
import { trackSearchUsed, trackSearchFilterApplied } from "../utils/telemetry";
import "../styles/card.css";
import "../styles/search.css";

// Result cards
import ProjectResultCard from "../components/search/cards/ProjectResultCard";
import UserResultCard from "../components/search/cards/UserResultCard";
import PostResultCard from "../components/search/cards/PostResultCard";
import FileResultCard from "../components/search/cards/FileResultCard";
import TaskResultCard from "../components/search/cards/TaskResultCard";

// Filters
import SearchFilters from "../components/search/SearchFilters";
// Tokens
import { parseSearchTokens, normalizeTypes } from "../utils/searchTokens";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../context/AuthContext";

const TYPE_META = {
  project: { icon: Folder, label: "Projects" },
  task:    { icon: CheckCircle2, label: "Tasks" },
  user:    { icon: UserIcon, label: "People" },
  post:    { icon: MessageSquare, label: "Posts" },
  file:    { icon: FileIcon, label: "Files" },
};
const ALL_TYPES = Object.keys(TYPE_META);

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ WORLD-CLASS FIX: Data Adapter Pattern
// Resolves the impedance mismatch between api/search.js (flat array)
// and SearchPage UI (categorized object). Also extracts the 'raw' payload
// so child cards get exactly the database document they expect!
// ═══════════════════════════════════════════════════════════════════════════════
function coerceResults(data) {
  const result = { projects: [], tasks: [], users: [], posts: [], files: [] };

  // 1. Handle modern unified flat array from searchAll()
  if (Array.isArray(data)) {
    data.forEach(item => {
      // Extract raw DB document so standard cards render perfectly
      const payload = item.raw || item; 
      
      if (item.type === 'project') result.projects.push(payload);
      else if (item.type === 'task') result.tasks.push(payload);
      else if (item.type === 'person' || item.type === 'user') result.users.push(payload);
      else if (item.type === 'post') result.posts.push(payload);
      else if (item.type === 'file') result.files.push(payload);
    });
    return result;
  }

  // 2. Handle legacy object shape
  result.projects = Array.isArray(data?.projects) ? data.projects : [];
  result.tasks    = Array.isArray(data?.tasks) ? data.tasks : [];
  result.users    = Array.isArray(data?.users) ? data.users : [];
  result.posts    = Array.isArray(data?.posts) ? data.posts : [];
  result.files    = Array.isArray(data?.files) ? data.files : [];
  
  return result;
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

export default function SearchPage() {
  useDocumentTitle("Search");
  const { user: authUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialQ = params.get("q") || "";
  const initialSort = params.get("sort") || "relevance";
  const initialTypes = normalizeTypes(params.get("types"), ALL_TYPES);
  const initialScope = params.get("scope") || "all"; // 'all' | 'project' | 'mine'

  const [q, setQ] = useState(initialQ);
  const [types, setTypes] = useState(initialTypes.length ? initialTypes : ALL_TYPES);
  const [sort, setSort] = useState(initialSort);
  const [scope, setScope] = useState(initialScope);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], users: [], posts: [], files: [] });

  // For a11y: count live region
  const liveRef = useRef(null);

  // Keyboard nav across the flattened result list
  const [activeIdx, setActiveIdx] = useState(0);
  const flat = useMemo(() => {
    const seq = [];
    if (types.includes("project")) results.projects.forEach((x) => seq.push({ type: "project", data: x }));
    if (types.includes("task"))    results.tasks.forEach((x) => seq.push({ type: "task", data: x }));
    if (types.includes("user"))    results.users.forEach((x) => seq.push({ type: "user", data: x }));
    if (types.includes("post"))    results.posts.forEach((x) => seq.push({ type: "post", data: x }));
    if (types.includes("file"))    results.files.forEach((x) => seq.push({ type: "file", data: x }));
    return seq;
  }, [results, types]);

  const tokens = useMemo(() => parseSearchTokens(q || ""), [q]);

  // Run search when q/types/sort/scope changes (debounced)
  useEffect(() => {
    let alive = true;

    const doSearch = async () => {
      // keep URL in sync
      const queryTypes = types.join(",");
      const nextParams = new URLSearchParams(location.search);
      nextParams.set("q", q);
      nextParams.set("sort", sort);
      nextParams.set("types", queryTypes);
      nextParams.set("scope", scope);
      setParams(nextParams, { replace: true });

      const payload = {
        q,
        types,
        sort,
        scope,
        page: 1,
        limit: 25,
      };

      setLoading(true);
      try {
        let data;
        // Prefer modern signature: searchAll({ ... })
        try {
          data = await searchAll(payload);
        } catch {
          // Back-compat with earlier helper: searchAll("text")
          data = await searchAll(q);
        }
        
        if (!alive) return;
        const coerced = coerceResults(data);
        setResults(coerced);

        // live region announce
        const total = ["projects","tasks","users","posts","files"].reduce((n, k) => n + (coerced[k]?.length || 0), 0);
        if (liveRef.current) liveRef.current.textContent = `${total} results`;

        try { trackSearchUsed?.({ q, types, sort, scope }); } catch {}
      } catch (err) {
        if (alive) setResults({ projects: [], tasks: [], users: [], posts: [], files: [] });
      } finally {
        if (alive) setLoading(false);
      }
    };

    const timer = setTimeout(doSearch, 150);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, types.join("|"), sort, scope]);

  const toggleType = (t) => {
    setTypes((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      try { trackSearchFilterApplied?.({ type: t, enabled: !has }); } catch {}
      return next.length ? next : prev; // avoid zero-type state
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Effect already fires telemetry; this covers explicit submit actions too
    try { trackSearchUsed?.({ q, types, sort, scope, submit: true }); } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
  };

  const openItem = (item) => {
    if (!item) return;
    const { type, data } = item;
    if (type === "project") {
      navigate(`/projects/${data._id || data.id}`);
    } else if (type === "task") {
      const pid = data.projectId || data.project_id || data.project?._id || data.project?.id;
      if (pid) navigate(`/projects/${pid}?task=${data._id || data.id}`);
      else navigate(`/projects`);
    } else if (type === "user") {
      const profileKey = data.username || data.handle || data.slug || data._id || data.id;

      const resultUsername = normalizeComparable(data.username || data.handle || data.slug);
      const resultId = normalizeId(data._id || data.id || data.userId);

      const authUsername = normalizeComparable(
        authUser?.username || authUser?.handle || authUser?.slug
      );
      const authId = normalizeId(authUser?._id || authUser?.id || authUser?.userId);

      const isCurrentUser =
        Boolean(resultUsername && authUsername && resultUsername === authUsername) ||
        Boolean(resultId && authId && resultId === authId);

      navigate(
        isCurrentUser
          ? "/profile"
          : profileKey
            ? `/profile/${encodeURIComponent(String(profileKey))}`
            : "/profile"
      );
    } else if (type === "post") {
      const pid = data.projectId || data.project?.id || data.project?._id;
      if (pid) navigate(`/projects/${pid}`);
    } else if (type === "file") {
      const pid = data.projectId || data.project?.id || data.project?._id;
      if (pid) navigate(`/projects/${pid}`);
    }
  };

  const renderGroup = (tKey, rows) => {
    if (!types.includes(tKey) || rows.length === 0) return null;
    const { icon: Icon, label } = TYPE_META[tKey] || {};
    const items = (() => {
      if (tKey === "project") return rows.map(r => <ProjectResultCard key={r._id || r.id} project={r} />);
      if (tKey === "user")    return rows.map(r => <UserResultCard    key={r._id || r.id || r.username} user={r} />);
      if (tKey === "post")    return rows.map(r => <PostResultCard    key={r._id || r.id} post={r} />);
      if (tKey === "file")    return rows.map(r => <FileResultCard    key={r._id || r.id} file={r} />);
      if (tKey === "task")    return rows.map(r => <TaskResultCard    key={r._id || r.id} task={r} />);
      return null;
    })();

    return (
      <section className="mt-5" aria-label={label}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          <Icon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          {label}
        </div>
        <div className="space-y-2" role="list">
          {items}
        </div>
      </section>
    );
  };

  const totalResults = ["projects","tasks","users","posts","files"].reduce((n, k) => n + (results[k]?.length || 0), 0);

  return (
    <main id="main" role="main" tabIndex={-1} onKeyDown={onKeyDown} className="min-h-screen bg-slate-50 dark:bg-[#09090B]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Search OpenShare</h1>
          <p className="text-slate-500 dark:text-zinc-400">Find projects, tasks, people, and files across your workspace.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#111113] p-5 shadow-sm dark:shadow-none">
          {/* Search input */}
          <form onSubmit={onSubmit} role="search" aria-label="Global search">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              </div>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
                placeholder="Search @users, #projects, and more…"
                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                aria-label="Search query"
              />
              <button
                type="submit"
                className="rounded-xl px-6 py-2.5 text-sm font-bold bg-slate-100 dark:bg-[#1f1f23] text-slate-700 dark:text-zinc-300 hover:bg-violet-600 hover:text-white transition-all"
                aria-label="Run search"
              >
                Search
              </button>
            </div>
          </form>

          {/* Parsed tokens */}
          {tokens.atUsers.length > 0 || tokens.hashProjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-hidden="false">
              {tokens.atUsers.map((u) => (
                <span key={`u:${u}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">@{u}</span>
              ))}
              {tokens.hashProjects.map((p) => (
                <span key={`p:${p}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">#{p}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#1f1f23]">
            {/* Filters (types / scope / sort) */}
            <SearchFilters
              types={types}
              allTypes={ALL_TYPES}
              onToggleType={toggleType}
              sort={sort}
              onChangeSort={setSort}
              scope={scope}
              onChangeScope={setScope}
            />
          </div>
        </div>

        {/* Live result count for screen readers */}
        <div ref={liveRef} aria-live="polite" className="sr-only">
          {totalResults} results
        </div>

        {/* Results Area */}
        <div role="listbox" aria-label="Search results" className="mt-8">
          
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-500 dark:text-zinc-400 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> 
              <span className="font-medium">Scouring the database…</span>
            </div>
          )}

          {/* ⭐ MetaLab Principle: Honest data or no data. Engage the user on empty state. */}
          {!loading && totalResults === 0 && q.length > 1 && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1f1f23] flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No results found for "{q}"</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                We couldn't find anything matching your search. Try adjusting your filters or using different keywords.
              </p>
            </div>
          )}

          {/* Grouped lists */}
          {renderGroup("project", results.projects)}
          {renderGroup("task", results.tasks)}
          {renderGroup("user", results.users)}
          {renderGroup("post", results.posts)}
          {renderGroup("file", results.files)}
        </div>
      </div>
    </main>
  );
}

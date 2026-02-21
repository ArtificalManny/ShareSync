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
import TaskResultCard from "../components/search/cards/TasxkResultCard";

// Filters
import SearchFilters from "../components/search/SearchFilters";
// Tokens
import { parseSearchTokens, normalizeTypes } from "../utils/searchTokens";

const TYPE_META = {
  project: { icon: Folder, label: "Projects" },
  task:    { icon: CheckCircle2, label: "Tasks" },
  user:    { icon: UserIcon, label: "People" },
  post:    { icon: MessageSquare, label: "Posts" },
  file:    { icon: FileIcon, label: "Files" },
};
const ALL_TYPES = Object.keys(TYPE_META);

function coerceResults(data) {
  // Accept both legacy {projects, tasks} or richer shape {projects, tasks, users, posts, files}
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const tasks    = Array.isArray(data?.tasks) ? data.tasks : [];
  const users    = Array.isArray(data?.users) ? data.users : [];
  const posts    = Array.isArray(data?.posts) ? data.posts : [];
  const files    = Array.isArray(data?.files) ? data.files : [];
  return { projects, tasks, users, posts, files };
}

export default function SearchPage() {
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
        // Optionally pass scoped ids if you wire them later:
        // projectId: scope === "project" ? currentProjectId : undefined,
        // userId: scope === "mine" ? currentUserId : undefined,
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
      } catch {
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
      const uname = data.username || data.handle || data.slug || data.id;
      navigate(uname ? `/u/${uname}` : `/profile`);
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
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className="mt-2 space-y-2" role="list">
          {items}
        </div>
      </section>
    );
  };

  const totalResults = ["projects","tasks","users","posts","files"].reduce((n, k) => n + (results[k]?.length || 0), 0);

  return (
    <main id="main" role="main" tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
        <div className="card rounded-2xl border border-border bg-surface p-4">
          {/* Search input */}
          <form onSubmit={onSubmit} role="search" aria-label="Global search">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
                placeholder="Search @users, #projects, and more…"
                className="flex-1 bg-transparent outline-none text-base"
                aria-label="Search query"
              />
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm border border-border hover:bg-slate-50 dark:hover:bg-slate-800/60"
                aria-label="Run search"
              >
                Search
              </button>
            </div>
          </form>

          {/* Parsed tokens */}
          <div className="mt-2 flex flex-wrap items-center gap-2" aria-hidden={tokens.atUsers.length + tokens.hashProjects.length === 0 ? "true" : "false"}>
            {tokens.atUsers.map((u) => (
              <span key={`u:${u}`} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">@{u}</span>
            ))}
            {tokens.hashProjects.map((p) => (
              <span key={`p:${p}`} className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">#{p}</span>
            ))}
          </div>

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

        {/* Live result count for screen readers */}
        <div
          ref={liveRef}
          aria-live="polite"
          className="sr-only"
        >
          {totalResults} results
        </div>

        {/* Results */}
        <div role="listbox" aria-label="Search results" className="mt-4">
          {loading && (
            <div className="text-sm text-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          )}

          {!loading && totalResults === 0 && (
            <div className="text-sm text-muted">No results.</div>
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

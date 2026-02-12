// src/pages/Search.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: Discover + Search — One source of truth for public listings
//
// - Projects results now come from /api/discovery?q=... (frontend-safe)
// - Other types remain mocked until a unified /api/search endpoint exists
//
// Phase 2: Moderation Gate (optional)
// - If VITE_MODERATION_GATE_V1 === "true": filter out non-approved projects defensively
//   (missing moderationStatus treated as approved for backwards compatibility)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Users,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";

import EmptySearch from "../components/empty-states/EmptySearch";
import { useMomentumContext } from "../contexts/MomentumContext";

// ✅ Phase 1: Projects search uses Discovery endpoint (public-listed source of truth)
import { searchPublicListedProjects } from "../api/search";

// ──────────────────────────────────────────────────────────────
// Phase 2 Moderation Gate (frontend-safe)
// ──────────────────────────────────────────────────────────────
const MODERATION_GATE_V1 = String(import.meta?.env?.VITE_MODERATION_GATE_V1 || "false") === "true";

function isModerationApproved(item) {
  if (!MODERATION_GATE_V1) return true;
  const s = String(item?.moderationStatus || "approved").toLowerCase();
  return s === "approved";
}

/* ─────────────────────────────────────────────────────────────────────────
   SEARCH RESULT TYPES
───────────────────────────────────────────────────────────────────────── */
const RESULT_TYPES = {
  project: { icon: FolderKanban, color: "text-brand-400", bg: "bg-brand-500/10", label: "Project" },
  task: { icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Task" },
  message: { icon: MessageSquare, color: "text-success-400", bg: "bg-success-500/10", label: "Message" },
  person: { icon: Users, color: "text-warning-400", bg: "bg-warning-500/10", label: "Person" },
  document: { icon: FileText, color: "text-energy-400", bg: "bg-energy-500/10", label: "Document" },
};

/* ─────────────────────────────────────────────────────────────────────────
   MOCK SEARCH RESULTS (non-project types for now)
───────────────────────────────────────────────────────────────────────── */
const mockNonProjectSearch = async (query) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (!query || query.length < 2) return [];

  const allResults = [
    { id: "t1", type: "task", title: "Fix login bug", description: "In ShareSync v2", url: "/projects/1/tasks/1" },
    { id: "t2", type: "task", title: "Write documentation", description: "API Integration docs", url: "/projects/2/tasks/1" },
    { id: "m1", type: "message", title: "Great work on the momentum engine!", description: "From Sarah Chen", url: "/messages/1" },
    { id: "p1", type: "person", title: "Sarah Chen", description: "Product Designer", url: "/team/sarah" },
    { id: "p2", type: "person", title: "Alex Rivera", description: "Backend Engineer", url: "/team/alex" },
    { id: "d1", type: "document", title: "Project Roadmap", description: "Q1 Planning", url: "/docs/roadmap" },
  ];

  const lower = query.toLowerCase();
  return allResults.filter(
    (r) => r.title.toLowerCase().includes(lower) || r.description.toLowerCase().includes(lower)
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   NORMALIZE: Discovery Project -> Search result shape
───────────────────────────────────────────────────────────────────────── */
function projectToResult(p) {
  if (!p || typeof p !== "object") return null;

  // ✅ Phase 2 moderation gate (defensive)
  if (!isModerationApproved(p)) return null;

  const id = p._id || p.id || p.projectId;
  if (!id) return null;

  const title = p.name || p.title || "Untitled Project";
  const description =
    p.description ||
    (Array.isArray(p.tags) && p.tags.length ? `Tags: ${p.tags.join(", ")}` : "Public project");

  return {
    id: String(id),
    type: "project",
    title,
    description,
    url: `/projects/${id}`,
    raw: p,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   SEARCH RESULT ITEM
───────────────────────────────────────────────────────────────────────── */
const SearchResultItem = ({ result, onClick, isSelected }) => {
  const typeConfig = RESULT_TYPES[result.type] || RESULT_TYPES.document;
  const Icon = typeConfig.icon;

  return (
    <button
      onClick={() => onClick(result)}
      className={`
        group w-full flex items-center gap-4 p-4 rounded-xl
        transition-all duration-200
        ${isSelected ? "bg-brand-500/10 border border-brand-500/20" : "hover:bg-surface-2 border border-transparent"}
      `}
    >
      <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${typeConfig.color}`} />
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">{result.title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
        </div>
        <p className="text-xs text-text-tertiary truncate">{result.description}</p>
      </div>

      <ArrowRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   SEARCH FILTERS
───────────────────────────────────────────────────────────────────────── */
const SearchFilters = ({ activeFilter, onFilterChange, resultCounts }) => {
  const filters = [
    { key: "all", label: "All" },
    { key: "project", label: "Projects", icon: FolderKanban },
    { key: "task", label: "Tasks", icon: CheckSquare },
    { key: "message", label: "Messages", icon: MessageSquare },
    { key: "person", label: "People", icon: Users },
    { key: "document", label: "Docs", icon: FileText },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const count =
          filter.key === "all"
            ? Object.values(resultCounts).reduce((a, b) => a + b, 0)
            : resultCounts[filter.key] || 0;

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              transition-all duration-200
              ${
                activeFilter === filter.key
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-2 border border-transparent"
              }
            `}
          >
            {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
            <span>{filter.label}</span>
            {count > 0 && (
              <span
                className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${activeFilter === filter.key ? "bg-brand-500/20" : "bg-surface-2"}
              `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   TRENDING / POPULAR ITEMS (for empty state)
───────────────────────────────────────────────────────────────────────── */
const TRENDING_ITEMS = [
  { name: "ShareSync", icon: FolderKanban },
  { name: "Tasks", icon: CheckSquare },
  { name: "Team", icon: MessageSquare },
  { name: "Docs", icon: FileText },
];

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SEARCH PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  const initialQ = searchParams.get("q") || "";

  // Search state
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Recent searches (persisted)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentSearches") || "[]");
    } catch {
      return [];
    }
  });

  // Momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch {}
  const { isFireMode } = momentumContext;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ✅ IMPORTANT: If Navbar routes to /search?q=... while Search.jsx is already mounted,
  // sync the input with the URL.
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    setQuery((prev) => (prev === urlQ ? prev : urlQ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when query changes
  useEffect(() => {
    const q = String(query || "");
    if (q) setSearchParams({ q });
    else setSearchParams({});
  }, [query, setSearchParams]);

  // Perform search when query changes
  useEffect(() => {
    let alive = true;

    const performSearch = async () => {
      const q = String(query || "").trim();
      if (!q || q.length < 2) {
        if (!alive) return;
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        // Phase 1: Projects come from /discovery?q=...
        const discoveredProjects = await searchPublicListedProjects(q);
        const projectResults = (discoveredProjects || [])
          .map(projectToResult)
          .filter(Boolean);

        // Other types still mocked (safe)
        const otherResults = await mockNonProjectSearch(q);

        if (!alive) return;

        const merged = [...projectResults, ...otherResults];
        setResults(merged);
        setSelectedIndex(0);
      } catch (error) {
        if (!alive) return;
        console.error("Search error:", error);
        setResults([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => {
      alive = false;
      clearTimeout(debounce);
    };
  }, [query]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (activeFilter === "all") return results;
    return results.filter((r) => r.type === activeFilter);
  }, [results, activeFilter]);

  // Count results by type
  const resultCounts = useMemo(() => {
    return results.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
  }, [results]);

  // Handle result click
  const handleResultClick = (result) => {
    const q = String(query || "").trim();

    // Add to recent searches
    if (q && !recentSearches.includes(q)) {
      const updated = [q, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    }

    navigate(result.url);
  };

  // Handle search from empty state
  const handleSearchFromEmpty = (searchTerm) => {
    setQuery(searchTerm);
    inputRef.current?.focus();
  };

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(filteredResults[selectedIndex]);
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredResults, selectedIndex]);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[900px] mx-auto">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary mb-6">Search</h1>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, messages, people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`
              w-full pl-12 pr-12 py-4 rounded-xl
              bg-surface-1 border border-white/[0.06]
              text-lg text-text-primary
              placeholder:text-text-tertiary
              focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20
              transition-all duration-200
              ${isFireMode ? "border-energy-500/20" : ""}
            `}
          />

          {/* Loading indicator */}
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 animate-spin" />}

          {/* Clear button */}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 font-mono">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 font-mono">Enter</kbd>
            to select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 font-mono">Esc</kbd>
            to close
          </span>
        </div>

        {MODERATION_GATE_V1 && (
          <div className="mt-3 text-xs text-text-tertiary text-center">
            Moderation gate enabled: showing approved listings only.
          </div>
        )}
      </header>

      {/* RESULTS */}
      {query && query.length >= 2 ? (
        <>
          {/* Filters */}
          {results.length > 0 && (
            <div className="mb-6">
              <SearchFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} resultCounts={resultCounts} />
            </div>
          )}

          {/* Results list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-1 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-surface-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-2 rounded w-1/3" />
                    <div className="h-3 bg-surface-2 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}:${result.id}`}
                  result={result}
                  onClick={handleResultClick}
                  isSelected={index === selectedIndex}
                />
              ))}
            </div>
          ) : (
            <EmptySearch
              query={query}
              suggestions={["ShareSync", "Tasks", "Team"].filter((s) => s.toLowerCase().startsWith(query.toLowerCase().charAt(0)))}
              recentSearches={recentSearches}
              trendingItems={TRENDING_ITEMS}
              onSearch={handleSearchFromEmpty}
              onCreateProject={(q) => navigate(`/projects/new?name=${encodeURIComponent(q)}`)}
              onCreateTask={(q) => navigate(`/tasks/new?title=${encodeURIComponent(q)}`)}
              onClearRecent={handleClearRecent}
              showCreate={true}
              showRecent={true}
              showTrending={false}
              variant="illustrated"
            />
          )}
        </>
      ) : (
        <EmptySearch
          query=""
          recentSearches={recentSearches}
          trendingItems={TRENDING_ITEMS}
          onSearch={handleSearchFromEmpty}
          onClearRecent={handleClearRecent}
          showCreate={false}
          showRecent={true}
          showTrending={true}
          variant="illustrated"
        />
      )}
    </div>
  );
}

// src/pages/Search.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Global Search Page
// ═══════════════════════════════════════════════════════════════════════════════
//
// Global search across all content types:
// - Projects
// - Tasks
// - Messages
// - Team members
// - Notes/Documents
//
// ⭐ PHASE D: EmptySearch when no results found
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  X, 
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Users,
  FileText,
  Clock,
  ArrowRight,
  Command,
  Loader2,
} from 'lucide-react';

// ⭐ PHASE D: Import empty state component
import EmptySearch from '../components/empty-states/EmptySearch';

// Import momentum context if available
import { useMomentumContext } from '../contexts/MomentumContext';

/* ─────────────────────────────────────────────────────────────────────────
   SEARCH RESULT TYPES
───────────────────────────────────────────────────────────────────────── */
const RESULT_TYPES = {
  project: { icon: FolderKanban, color: 'text-brand-400', bg: 'bg-brand-500/10', label: 'Project' },
  task: { icon: CheckSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Task' },
  message: { icon: MessageSquare, color: 'text-success-400', bg: 'bg-success-500/10', label: 'Message' },
  person: { icon: Users, color: 'text-warning-400', bg: 'bg-warning-500/10', label: 'Person' },
  document: { icon: FileText, color: 'text-energy-400', bg: 'bg-energy-500/10', label: 'Document' },
};

/* ─────────────────────────────────────────────────────────────────────────
   MOCK SEARCH RESULTS - Replace with real API
───────────────────────────────────────────────────────────────────────── */
const mockSearch = async (query) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query || query.length < 2) return [];
  
  const allResults = [
    { id: '1', type: 'project', title: 'ShareSync v2', description: 'Momentum-based project tracker', url: '/projects/1' },
    { id: '2', type: 'project', title: 'API Integration', description: 'Third-party API connections', url: '/projects/2' },
    { id: '3', type: 'task', title: 'Fix login bug', description: 'In ShareSync v2', url: '/projects/1/tasks/1' },
    { id: '4', type: 'task', title: 'Write documentation', description: 'API Integration docs', url: '/projects/2/tasks/1' },
    { id: '5', type: 'message', title: 'Great work on the momentum engine!', description: 'From Sarah Chen', url: '/messages/1' },
    { id: '6', type: 'person', title: 'Sarah Chen', description: 'Product Designer', url: '/team/sarah' },
    { id: '7', type: 'person', title: 'Alex Rivera', description: 'Backend Engineer', url: '/team/alex' },
    { id: '8', type: 'document', title: 'Project Roadmap', description: 'Q1 2024 Planning', url: '/docs/roadmap' },
  ];
  
  const lowerQuery = query.toLowerCase();
  return allResults.filter(r => 
    r.title.toLowerCase().includes(lowerQuery) ||
    r.description.toLowerCase().includes(lowerQuery)
  );
};

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
        w-full flex items-center gap-4 p-4 rounded-xl
        transition-all duration-200
        ${isSelected 
          ? 'bg-brand-500/10 border border-brand-500/20' 
          : 'hover:bg-surface-2 border border-transparent'
        }
      `}
    >
      <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${typeConfig.color}`} />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {result.title}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
        </div>
        <p className="text-xs text-text-tertiary truncate">
          {result.description}
        </p>
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
    { key: 'all', label: 'All' },
    { key: 'project', label: 'Projects', icon: FolderKanban },
    { key: 'task', label: 'Tasks', icon: CheckSquare },
    { key: 'message', label: 'Messages', icon: MessageSquare },
    { key: 'person', label: 'People', icon: Users },
    { key: 'document', label: 'Docs', icon: FileText },
  ];
  
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => {
        const count = filter.key === 'all' 
          ? Object.values(resultCounts).reduce((a, b) => a + b, 0)
          : resultCounts[filter.key] || 0;
          
        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              transition-all duration-200
              ${activeFilter === filter.key
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2 border border-transparent'
              }
            `}
          >
            {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
            <span>{filter.label}</span>
            {count > 0 && (
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${activeFilter === filter.key ? 'bg-brand-500/20' : 'bg-surface-2'}
              `}>
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
  { name: 'ShareSync v2', icon: FolderKanban },
  { name: 'Sprint Tasks', icon: CheckSquare },
  { name: 'Team Chat', icon: MessageSquare },
  { name: 'Project Docs', icon: FileText },
];

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SEARCH PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  
  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Recent searches (persisted)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });
  
  // Get momentum context if available
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {
    // Context not available
  }
  
  const { glowLevel, isFireMode } = momentumContext;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const searchResults = await mockSearch(query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return results;
    return results.filter(r => r.type === activeFilter);
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
    // Add to recent searches
    if (!recentSearches.includes(query)) {
      const updated = [query, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
    
    // Navigate to result
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
    localStorage.removeItem('recentSearches');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(filteredResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredResults, selectedIndex]);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[900px] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════════
          SEARCH HEADER
      ═══════════════════════════════════════════════════════════════════ */}
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
              ${isFireMode ? 'border-energy-500/20' : ''}
            `}
          />
          
          {/* Loading indicator */}
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 animate-spin" />
          )}
          
          {/* Clear button */}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
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
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SEARCH RESULTS
      ═══════════════════════════════════════════════════════════════════ */}
      {query && query.length >= 2 ? (
        <>
          {/* Filters */}
          {results.length > 0 && (
            <div className="mb-6">
              <SearchFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                resultCounts={resultCounts}
              />
            </div>
          )}
          
          {/* Results list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
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
                  key={result.id}
                  result={result}
                  onClick={handleResultClick}
                  isSelected={index === selectedIndex}
                />
              ))}
            </div>
          ) : (
            /* ⭐ PHASE D: Empty Search State */
            <EmptySearch
              query={query}
              suggestions={['ShareSync', 'Tasks', 'Team'].filter(s => 
                s.toLowerCase().startsWith(query.toLowerCase().charAt(0))
              )}
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
        /* Initial state - show recent and trending */
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

// src/components/empty-states/EmptySearch.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Search Results
// ═══════════════════════════════════════════════════════════════════════════════
//
// No search results should still feel productive!
// Offer alternatives and creation opportunities.
//
// Key messaging:
// - "Nothing found, but here's what you could create"
// - Suggest related items
// - Offer to create what they're looking for
// - Show recent/popular alternatives
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Sparkles, 
  FileText,
  FolderPlus,
  ListTodo,
  ArrowRight,
  Clock,
  TrendingUp,
  Lightbulb,
  X,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { SearchIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const SearchSuggestions = ({ query, suggestions = [], onSelect }) => {
  if (!suggestions.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-warning-500" />
        <span className="text-xs text-text-tertiary">Did you mean?</span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion)}
            className="
              px-3 py-1.5 rounded-lg
              bg-surface-2 border border-white/[0.06]
              hover:bg-surface-3 hover:border-brand-500/20
              text-sm text-text-secondary hover:text-text-primary
              transition-all duration-200
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FROM SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
const CreateFromSearch = ({ query, onCreateProject, onCreateTask, onCreateNote }) => {
  const { glowLevel } = useMomentumContext();
  
  const createOptions = [
    { 
      icon: FolderPlus, 
      label: 'Create Project', 
      description: `"${query}"`,
      action: onCreateProject,
      color: 'brand',
    },
    { 
      icon: ListTodo, 
      label: 'Create Task', 
      description: `"${query}"`,
      action: onCreateTask,
      color: 'cyan',
    },
    { 
      icon: FileText, 
      label: 'Create Note', 
      description: `"${query}"`,
      action: onCreateNote,
      color: 'success',
    },
  ].filter(opt => opt.action); // Only show options with handlers
  
  if (createOptions.length === 0 || !query) return null;
  
  const colorMap = {
    brand: 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border-brand-500/20',
    cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
    success: 'bg-success-500/10 hover:bg-success-500/20 text-success-400 border-success-500/20',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      <div className="text-xs text-text-tertiary mb-3 text-center">
        Can't find it? Create it!
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {createOptions.map((option, i) => (
          <motion.button
            key={i}
            onClick={() => option.action(query)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              border transition-all duration-200
              ${colorMap[option.color]}
              ${glowLevel >= 3 ? 'hover:shadow-sm' : ''}
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <option.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-medium text-text-primary">{option.label}</div>
              <div className="text-xs text-text-tertiary truncate max-w-[150px]">
                {option.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT SEARCHES
// ═══════════════════════════════════════════════════════════════════════════════
const RecentSearches = ({ searches = [], onSelect, onClear }) => {
  if (!searches.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 pt-6 border-t border-white/[0.06]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Clock className="w-3.5 h-3.5" />
          Recent searches
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {searches.slice(0, 5).map((search, i) => (
          <button
            key={i}
            onClick={() => onSelect(search)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-surface-1 border border-white/[0.06]
              hover:bg-surface-2
              text-sm text-text-secondary
              transition-all duration-200
            "
          >
            <Search className="w-3 h-3 text-text-tertiary" />
            {search}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDING/POPULAR ITEMS
// ═══════════════════════════════════════════════════════════════════════════════
const TrendingItems = ({ items = [], onSelect }) => {
  if (!items.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-6"
    >
      <div className="flex items-center justify-center gap-2 mb-3 text-xs text-text-tertiary">
        <TrendingUp className="w-3.5 h-3.5" />
        Popular right now
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {items.slice(0, 4).map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item)}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-surface-2 border border-white/[0.06]
              hover:bg-surface-3 hover:border-brand-500/20
              transition-all duration-200
              group
            "
          >
            <div className="w-6 h-6 rounded bg-brand-500/10 flex items-center justify-center">
              <item.icon className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptySearch({
  // Search state
  query = '',
  suggestions = [],
  recentSearches = [],
  trendingItems = [],
  
  // Actions
  onSearch,
  onCreateProject,
  onCreateTask,
  onCreateNote,
  onClearRecent,
  
  // Options
  showCreate = true,
  showRecent = true,
  showTrending = true,
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated'
  className = '',
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  const handleSuggestionSelect = (suggestion) => {
    if (onSearch) onSearch(suggestion);
  };
  
  // Generate title based on query
  const title = query 
    ? `No results for "${query}"`
    : "Start your search";
    
  const description = query
    ? "We couldn't find what you're looking for, but that's okay! You can try different keywords or create something new."
    : "Search across projects, tasks, notes, and more. Find anything in your workspace instantly.";
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Search className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-sm text-text-secondary mb-1">{title}</p>
        {query && (
          <p className="text-xs text-text-tertiary">Try different keywords</p>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <EmptyState
        illustration={SearchIllustration}
        title={title}
        description={description}
        variant={variant}
        size="default"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Suggestions */}
        {query && suggestions.length > 0 && (
          <SearchSuggestions 
            query={query}
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
          />
        )}
        
        {/* Create from search */}
        {showCreate && query && (
          <CreateFromSearch
            query={query}
            onCreateProject={onCreateProject}
            onCreateTask={onCreateTask}
            onCreateNote={onCreateNote}
          />
        )}
        
        {/* Trending items (when no query) */}
        {showTrending && !query && trendingItems.length > 0 && (
          <TrendingItems 
            items={trendingItems}
            onSelect={(item) => onSearch && onSearch(item.name)}
          />
        )}
        
        {/* Recent searches */}
        {showRecent && recentSearches.length > 0 && (
          <RecentSearches
            searches={recentSearches}
            onSelect={handleSuggestionSelect}
            onClear={onClearRecent}
          />
        )}
      </EmptyState>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for dropdown/popover)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptySearchCompact({ 
  query, 
  onCreateTask, 
  recentSearches = [],
  onSelectRecent,
  className = '' 
}) {
  return (
    <div className={`p-4 ${className}`}>
      {query ? (
        <div className="text-center">
          <Search className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-1">No results for "{query}"</p>
          {onCreateTask && (
            <button
              onClick={() => onCreateTask(query)}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors mt-2"
            >
              + Create task "{query}"
            </button>
          )}
        </div>
      ) : recentSearches.length > 0 ? (
        <div>
          <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent
          </div>
          <div className="space-y-1">
            {recentSearches.slice(0, 3).map((search, i) => (
              <button
                key={i}
                onClick={() => onSelectRecent && onSelectRecent(search)}
                className="w-full text-left px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-surface-2 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-text-tertiary">Start typing to search...</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for filtered lists)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptySearchInline({ 
  query, 
  entityType = 'items',
  onClearFilters,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <Search className="w-6 h-6 text-text-tertiary mb-2" />
      <p className="text-sm text-text-secondary">
        {query 
          ? `No ${entityType} match "${query}"`
          : `No ${entityType} found`
        }
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}

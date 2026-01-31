// src/components/navigation/CommandPalette.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Premium Command Palette (Cmd+K)
// Inspired by Linear, Raycast, Superhuman
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ArrowRight, Home, Folder, Users, User, Settings,
  Zap, Target, Ship, CheckCircle2, Plus, Clock, Star,
  Keyboard, Bell, Moon, Sun, LogOut, FileText, BarChart3,
  Rocket, MessageSquare, Calendar, Archive, Trash2, Copy,
  ExternalLink, Command, Hash, Sparkles, History, BookOpen
} from 'lucide-react';
import { useKeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const COMMAND_CATEGORIES = {
  navigation: { label: 'Navigation', icon: ArrowRight },
  actions: { label: 'Quick Actions', icon: Zap },
  projects: { label: 'Projects', icon: Folder },
  create: { label: 'Create', icon: Plus },
  settings: { label: 'Settings', icon: Settings },
  recent: { label: 'Recent', icon: History },
};

function getCommands(context = {}) {
  const { projects = [], recentPages = [], currentProject } = context;
  
  return [
    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'nav-home',
      category: 'navigation',
      label: 'Go to Home',
      sublabel: 'Mission Control',
      icon: Home,
      shortcut: 'cmd+shift+h',
      action: 'navigate',
      path: '/home',
      keywords: ['home', 'mission', 'control', 'dashboard'],
    },
    {
      id: 'nav-projects',
      category: 'navigation',
      label: 'Go to Projects',
      sublabel: 'Project Deck',
      icon: Folder,
      shortcut: 'cmd+shift+p',
      action: 'navigate',
      path: '/projects',
      keywords: ['projects', 'deck', 'list'],
    },
    {
      id: 'nav-arena',
      category: 'navigation',
      label: 'Go to Arena',
      sublabel: 'Team activity',
      icon: Users,
      action: 'navigate',
      path: '/arena',
      keywords: ['arena', 'team', 'leaderboard', 'activity'],
    },
    {
      id: 'nav-profile',
      category: 'navigation',
      label: 'Go to Profile',
      sublabel: 'Your identity',
      icon: User,
      shortcut: 'cmd+shift+i',
      action: 'navigate',
      path: '/profile',
      keywords: ['profile', 'identity', 'me', 'skills'],
    },
    {
      id: 'nav-settings',
      category: 'navigation',
      label: 'Go to Settings',
      icon: Settings,
      shortcut: 'cmd+,',
      action: 'navigate',
      path: '/settings',
      keywords: ['settings', 'preferences', 'config'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK ACTIONS
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'action-ship',
      category: 'actions',
      label: 'Ship Update',
      sublabel: 'Record a ship',
      icon: Rocket,
      shortcut: 'cmd+shift+s',
      action: 'modal',
      modal: 'ship',
      keywords: ['ship', 'deploy', 'release', 'launch'],
      highlight: true,
    },
    {
      id: 'action-task',
      category: 'actions',
      label: 'Quick Add Task',
      sublabel: 'Add to inbox',
      icon: CheckCircle2,
      shortcut: 'cmd+shift+t',
      action: 'modal',
      modal: 'task',
      keywords: ['task', 'todo', 'add', 'new'],
    },
    {
      id: 'action-focus',
      category: 'actions',
      label: 'Start Focus Session',
      sublabel: '25 min Pomodoro',
      icon: Target,
      shortcut: 'cmd+shift+f',
      action: 'callback',
      callback: 'startFocus',
      keywords: ['focus', 'pomodoro', 'timer', 'deep work'],
    },
    {
      id: 'action-fire-mode',
      category: 'actions',
      label: 'Toggle Fire Mode',
      sublabel: 'Urgent shipping mode',
      icon: Zap,
      action: 'callback',
      callback: 'toggleFireMode',
      keywords: ['fire', 'mode', 'urgent', 'crunch'],
      destructive: false,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'create-project',
      category: 'create',
      label: 'Create New Project',
      icon: Folder,
      action: 'modal',
      modal: 'createProject',
      keywords: ['new', 'project', 'create'],
    },
    {
      id: 'create-objective',
      category: 'create',
      label: 'Create Objective',
      icon: Target,
      action: 'modal',
      modal: 'createObjective',
      keywords: ['new', 'objective', 'goal', 'okr'],
    },
    {
      id: 'create-sprint',
      category: 'create',
      label: 'Create Sprint',
      icon: Calendar,
      action: 'modal',
      modal: 'createSprint',
      keywords: ['new', 'sprint', 'iteration'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SETTINGS / PREFERENCES
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'settings-theme-dark',
      category: 'settings',
      label: 'Switch to Dark Theme',
      icon: Moon,
      action: 'callback',
      callback: 'setDarkTheme',
      keywords: ['dark', 'theme', 'night', 'mode'],
    },
    {
      id: 'settings-theme-light',
      category: 'settings',
      label: 'Switch to Light Theme',
      icon: Sun,
      action: 'callback',
      callback: 'setLightTheme',
      keywords: ['light', 'theme', 'day', 'mode'],
    },
    {
      id: 'settings-shortcuts',
      category: 'settings',
      label: 'View Keyboard Shortcuts',
      icon: Keyboard,
      shortcut: 'cmd+/',
      action: 'modal',
      modal: 'shortcuts',
      keywords: ['keyboard', 'shortcuts', 'hotkeys', 'bindings'],
    },
    {
      id: 'settings-notifications',
      category: 'settings',
      label: 'Notification Settings',
      icon: Bell,
      action: 'navigate',
      path: '/settings/notifications',
      keywords: ['notifications', 'alerts', 'quiet'],
    },
    {
      id: 'action-logout',
      category: 'settings',
      label: 'Sign Out',
      icon: LogOut,
      action: 'callback',
      callback: 'logout',
      keywords: ['logout', 'sign out', 'exit'],
      destructive: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // DYNAMIC: PROJECTS
    // ─────────────────────────────────────────────────────────────────────────
    ...projects.map(project => ({
      id: `project-${project.id}`,
      category: 'projects',
      label: project.name,
      sublabel: project.status || 'Active',
      icon: Folder,
      action: 'navigate',
      path: `/projects/${project.id}`,
      keywords: [project.name.toLowerCase(), 'project'],
      color: project.color,
    })),

    // ─────────────────────────────────────────────────────────────────────────
    // DYNAMIC: RECENT PAGES
    // ─────────────────────────────────────────────────────────────────────────
    ...recentPages.slice(0, 5).map((page, i) => ({
      id: `recent-${i}`,
      category: 'recent',
      label: page.title,
      sublabel: page.type,
      icon: History,
      action: 'navigate',
      path: page.path,
      keywords: [page.title.toLowerCase()],
    })),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUZZY SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

function fuzzyMatch(text, query) {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 1000;
  
  // Starts with query
  if (textLower.startsWith(queryLower)) return 500 + (queryLower.length / textLower.length) * 100;
  
  // Contains query
  if (textLower.includes(queryLower)) return 200 + (queryLower.length / textLower.length) * 50;
  
  // Fuzzy character matching
  let queryIndex = 0;
  let score = 0;
  let consecutiveBonus = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5;
      queryIndex++;
    } else {
      consecutiveBonus = 0;
    }
  }
  
  if (queryIndex < queryLower.length) return 0; // Didn't match all query chars
  
  return score;
}

function searchCommands(commands, query) {
  if (!query.trim()) {
    // No query - show recent and highlighted commands first
    return commands.filter(cmd => 
      cmd.category === 'recent' || cmd.highlight
    ).slice(0, 8);
  }

  const scored = commands.map(cmd => {
    const labelScore = fuzzyMatch(cmd.label, query);
    const sublabelScore = cmd.sublabel ? fuzzyMatch(cmd.sublabel, query) * 0.5 : 0;
    const keywordScore = (cmd.keywords || []).reduce((max, kw) => 
      Math.max(max, fuzzyMatch(kw, query) * 0.7), 0
    );
    
    return {
      ...cmd,
      score: Math.max(labelScore, sublabelScore, keywordScore),
    };
  });

  return scored
    .filter(cmd => cmd.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CommandPalette({
  isOpen,
  onClose,
  onAction,
  context = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Get all commands
  const commands = useMemo(() => getCommands(context), [context]);
  
  // Search/filter commands
  const filteredCommands = useMemo(() => 
    searchCommands(commands, query), [commands, query]
  );

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      const cat = cmd.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const flat = [];
    Object.keys(groupedCommands).forEach(cat => {
      groupedCommands[cat].forEach(cmd => flat.push(cmd));
    });
    return flat;
  }, [groupedCommands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setAnimatingOut(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setAnimatingOut(true);
    setTimeout(() => {
      setAnimatingOut(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Execute command
  const executeCommand = useCallback((cmd) => {
    handleClose();
    
    // Small delay to let animation complete
    setTimeout(() => {
      switch (cmd.action) {
        case 'navigate':
          navigate(cmd.path);
          break;
        case 'modal':
          onAction?.({ type: 'modal', modal: cmd.modal });
          break;
        case 'callback':
          onAction?.({ type: 'callback', callback: cmd.callback });
          break;
        default:
          console.log('Unknown action:', cmd);
      }
    }, 100);
  }, [navigate, onAction, handleClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatList[selectedIndex]) {
          executeCommand(flatList[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedIndex(i => Math.max(i - 1, 0));
        } else {
          setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
        }
        break;
    }
  }, [flatList, selectedIndex, executeCommand, handleClose]);

  if (!isOpen && !animatingOut) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm
          transition-opacity duration-150
          ${animatingOut ? 'opacity-0' : 'opacity-100'}
        `}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`
        fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]
        pointer-events-none
      `}>
        <div className={`
          w-full max-w-2xl mx-4
          pointer-events-auto
          transition-all duration-150
          ${animatingOut 
            ? 'opacity-0 scale-95 translate-y-2' 
            : 'opacity-100 scale-100 translate-y-0'
          }
        `}>
          <div className="
            bg-surface-1 border border-white/[0.1] rounded-2xl
            shadow-2xl shadow-black/50
            overflow-hidden
          ">
            {/* Search Input */}
            <div className="relative border-b border-white/[0.06]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="
                  w-full py-4 pl-14 pr-4
                  bg-transparent text-text-primary text-lg
                  placeholder-text-tertiary
                  focus:outline-none
                "
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              
              {/* Shortcut hint */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-surface-2 text-xs text-text-tertiary border border-white/[0.06]">
                  Esc
                </kbd>
              </div>
            </div>

            {/* Results */}
            <div 
              ref={listRef}
              className="max-h-[400px] overflow-y-auto py-2"
            >
              {flatList.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
                  <p className="text-text-tertiary">No commands found</p>
                  <p className="text-xs text-text-tertiary mt-1">Try a different search</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, cmds]) => {
                  const categoryConfig = COMMAND_CATEGORIES[category] || { label: category };
                  
                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="px-4 py-2">
                        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                          {categoryConfig.label}
                        </span>
                      </div>

                      {/* Commands */}
                      {cmds.map((cmd) => {
                        flatIndex++;
                        const isSelected = flatIndex === selectedIndex;
                        const Icon = cmd.icon;

                        return (
                          <button
                            key={cmd.id}
                            data-index={flatIndex}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2.5
                              transition-colors
                              ${isSelected 
                                ? 'bg-brand/10' 
                                : 'hover:bg-surface-2/50'
                              }
                              ${cmd.destructive ? 'text-error-500' : ''}
                            `}
                          >
                            {/* Icon */}
                            <div className={`
                              w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                              ${cmd.highlight 
                                ? 'bg-brand/20' 
                                : cmd.destructive 
                                  ? 'bg-error-500/10' 
                                  : 'bg-surface-2'
                              }
                            `}
                              style={cmd.color ? { backgroundColor: `${cmd.color}20` } : {}}
                            >
                              <Icon className={`
                                w-4 h-4
                                ${cmd.highlight 
                                  ? 'text-brand' 
                                  : cmd.destructive 
                                    ? 'text-error-500' 
                                    : cmd.color 
                                      ? '' 
                                      : 'text-text-secondary'
                                }
                              `} 
                                style={cmd.color ? { color: cmd.color } : {}}
                              />
                            </div>

                            {/* Label */}
                            <div className="flex-1 text-left min-w-0">
                              <div className={`
                                text-sm font-medium truncate
                                ${cmd.destructive 
                                  ? 'text-error-500' 
                                  : isSelected 
                                    ? 'text-text-primary' 
                                    : 'text-text-secondary'
                                }
                              `}>
                                {cmd.label}
                              </div>
                              {cmd.sublabel && (
                                <div className="text-xs text-text-tertiary truncate">
                                  {cmd.sublabel}
                                </div>
                              )}
                            </div>

                            {/* Shortcut */}
                            {cmd.shortcut && (
                              <div className="flex items-center gap-1 shrink-0">
                                {formatShortcut(cmd.shortcut).split('').map((char, i) => (
                                  <kbd 
                                    key={i}
                                    className="
                                      min-w-[20px] h-5 px-1.5
                                      flex items-center justify-center
                                      rounded bg-surface-2 border border-white/[0.06]
                                      text-[10px] text-text-tertiary font-medium
                                    "
                                  >
                                    {char}
                                  </kbd>
                                ))}
                              </div>
                            )}

                            {/* Arrow indicator */}
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-brand shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="
              px-4 py-3 border-t border-white/[0.06]
              flex items-center justify-between
              bg-surface-2/30
            ">
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/[0.06]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/[0.06]">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/[0.06]">Esc</kbd>
                  Close
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs text-text-tertiary">ShareSync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function CommandPaletteProvider({ children, projects = [], onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentPages, setRecentPages] = useState([]);
  const location = useLocation();

  // Track recent pages
  useEffect(() => {
    const pageTitle = document.title || location.pathname;
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== location.pathname);
      return [
        { path: location.pathname, title: pageTitle, type: 'Page' },
        ...filtered,
      ].slice(0, 10);
    });
  }, [location.pathname]);

  // Global shortcut to open
  useKeyboardShortcut('cmd+k', () => setIsOpen(true), {
    id: 'open-command-palette',
    description: 'Open command palette',
    category: 'General',
    allowInInput: true,
  });

  // Also support ctrl+k on non-Mac
  useKeyboardShortcut('ctrl+k', () => setIsOpen(true), {
    id: 'open-command-palette-alt',
    hidden: true,
    allowInInput: true,
  });

  const context = useMemo(() => ({
    projects,
    recentPages,
  }), [projects, recentPages]);

  return (
    <>
      {children}
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAction={onAction}
        context={context}
      />
    </>
  );
}

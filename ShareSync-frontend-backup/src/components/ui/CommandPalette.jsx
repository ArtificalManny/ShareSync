// src/components/ui/CommandPalette.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Home, Folder, Users, User, Settings, Zap, 
  Rocket, CheckCircle2, Target, Moon, Sun, LogOut, Command 
} from 'lucide-react';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useAuth } from '../../context/AuthContext';

const COMMANDS = [
  { id: 'nav-home', category: 'Navigation', label: 'Go to Home', icon: Home, path: '/home', keywords: ['dashboard', 'main'] },
  { id: 'nav-projects', category: 'Navigation', label: 'Go to Projects', icon: Folder, path: '/projects', keywords: ['list', 'deck'] },
  { id: 'nav-profile', category: 'Navigation', label: 'Go to Profile', icon: User, path: '/profile', keywords: ['me', 'settings'] },
  { id: 'action-ship', category: 'Actions', label: 'Ship Update', icon: Rocket, action: 'ship', keywords: ['deploy', 'launch'] },
  { id: 'action-task', category: 'Actions', label: 'Quick Add Task', icon: CheckCircle2, action: 'task', keywords: ['todo', 'new'] },
  { id: 'action-focus', category: 'Actions', label: 'Start Focus Session', icon: Target, action: 'focus', keywords: ['timer', 'deep work'] },
  { id: 'theme-dark', category: 'Settings', label: 'Switch to Dark Mode', icon: Moon, action: 'theme-dark' },
  { id: 'theme-light', category: 'Settings', label: 'Switch to Light Mode', icon: Sun, action: 'theme-light' },
  { id: 'logout', category: 'System', label: 'Sign Out', icon: LogOut, action: 'logout', destructive: true },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS;
    return COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(q) || 
      cmd.category.toLowerCase().includes(q) ||
      (cmd.keywords && cmd.keywords.some(k => k.includes(q)))
    );
  }, [query]);

  // Group filtered results
  const grouped = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSelect = (cmd) => {
    if (cmd.path) navigate(cmd.path);
    if (cmd.action === 'logout') logout();
    // Other actions (task/ship) can trigger local events or context updates
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) handleSelect(selected);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[999]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white dark:bg-[#1f1f23] rounded-2xl shadow-2xl z-[1000] border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-white/5">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands, pages, or actions..."
                className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100 text-lg placeholder-slate-400"
              />
              <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-[10px] text-slate-500 font-medium uppercase">Esc</kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</div>
                  {cmds.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => handleSelect(cmd)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-violet-500 text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-violet-500'}`} />
                        <span className="text-sm font-medium flex-1 text-left">{cmd.label}</span>
                        {isSelected && <Command className="w-3 h-3 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div className="p-8 text-center text-slate-500">No results for "{query}"</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

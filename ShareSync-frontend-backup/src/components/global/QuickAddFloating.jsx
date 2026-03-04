// src/components/global/QuickAddFloating.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Sparkles, FolderDot, Calendar, User } from 'lucide-react';
import { useQuickAdd } from '../../hooks/useQuickAdd';
import { toast } from '../ui/toast';

export default function QuickAddFloating() {
  const { isOpen, close } = useQuickAdd();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Simulate creation & XP reward
    toast({
      title: "Move captured! +10 XP",
      description: `"${inputValue.trim()}" added to your inbox.`,
      variant: "xp", // Triggers the glowing violet toast from Phase 6.4
      icon: <Sparkles className="w-5 h-5 text-violet-400" />
    });

    close();
  };

  // Basic slash command parsing for visual feedback
  const hasAssignee = inputValue.includes('@');
  const hasProject = inputValue.includes('#');
  const hasDate = inputValue.includes('/');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glass Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[8000] bg-slate-900/30 backdrop-blur-sm"
          />

          {/* Floating Input Container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[8001] px-4"
          >
            <form 
              onSubmit={handleSubmit}
              className="relative flex items-center bg-white/90 dark:bg-[#1f1f23]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl p-2 overflow-hidden"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(139,92,246,0.1)' }}
            >
              <div className="pl-3 pr-2 text-violet-500">
                <PlusCircle className="w-6 h-6" />
              </div>
              
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a new task... (Try #project, @user, or /tomorrow)"
                className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-zinc-100 text-lg py-3 px-2 placeholder-slate-400 dark:placeholder-zinc-500"
              />

              <div className="flex items-center gap-2 pr-2">
                {hasProject && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md"><FolderDot className="w-3 h-3"/> Project</span>}
                {hasAssignee && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md"><User className="w-3 h-3"/> Assign</span>}
                {hasDate && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-md"><Calendar className="w-3 h-3"/> Date</span>}
                
                <kbd className="hidden sm:inline-block ml-2 px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-[10px] text-slate-500 font-medium uppercase">
                  Enter
                </kbd>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

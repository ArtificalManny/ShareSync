// src/components/focus/FocusModeOverlay.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, RotateCcw, Target, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { useSprint } from '../../context/SprintContext';
import { toast } from '../ui/toast'; 

export default function FocusModeOverlay() {
  const { 
    isFocusMode, 
    toggleFocusMode, 
    status, 
    intent, 
    formatRemaining, 
    start, 
    pause, 
    resume, 
    reset 
  } = useSprint();

  // Local state for a quick sub-task checklist to keep momentum high
  const [subtasks, setSubtasks] = useState([
    { id: 1, text: 'Clear physical and digital distractions', done: false },
    { id: 2, text: 'Execute primary objective', done: false },
    { id: 3, text: 'Review, format, and push', done: false }
  ]);

  const toggleSubtask = (id) => {
    setSubtasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDone = () => {
    toast({ 
      title: "Session Complete! +50 XP", 
      description: "Great focus. Your momentum is building.",
      variant: "success", 
      icon: <Sparkles className="w-5 h-5 text-amber-400" /> 
    });
    reset();
    toggleFocusMode(false);
  };

  const isRunning = status === 'running';

  return (
    <AnimatePresence>
      {isFocusMode && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4"
        >
          {/* Close Button */}
          <button 
            onClick={() => toggleFocusMode(false)}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Focus Card */}
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-xl bg-white dark:bg-[#1f1f23] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            {/* Top Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />

            <div className="p-10 flex flex-col items-center">
              
              {/* Intent / Task Name */}
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-violet-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                  {intent || "Deep Work Session"}
                </h2>
              </div>

              {/* Massive Pomodoro Timer */}
              <div className="text-[120px] font-black tabular-nums tracking-tighter text-slate-900 dark:text-white leading-none mb-10 drop-shadow-sm">
                {formatRemaining()}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mb-10">
                <button
                  onClick={() => reset()}
                  className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => isRunning ? pause() : (status === 'paused' ? resume() : start())}
                  className="w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 Available)' }}
                >
                  {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
              </div>

              {/* Sub-task Checklist */}
              <div className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5 mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Focus Checklist</h3>
                <div className="space-y-3">
                  {subtasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleSubtask(task.id)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {task.done ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-500 transition-colors" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-zinc-600 group-hover:text-violet-400 transition-colors" />
                      )}
                      <span className={`text-sm font-medium transition-all ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-zinc-300'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* "I'm Done" Reward Button */}
              <button
                onClick={handleDone}
                className="w-full py-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 font-bold text-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all active:scale-[0.98]"
              >
                Mark Complete & Collect XP
              </button>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// src/components/empty-states/EmptyProfileAnalytics.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Rocket, Activity } from 'lucide-react';

export default function EmptyProfileAnalytics() {
  const navigate = useNavigate();

  return (
    <div 
      className="p-8 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]"
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.04)' }}
    >
      {/* Background faint glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Icons Animation */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-2xl rotate-6 animate-pulse" />
        <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
          <Brain className="w-8 h-8 text-violet-500" />
        </div>
        
        {/* Decorative micro-elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center border border-white dark:border-zinc-800">
          <Activity className="w-3 h-3 text-teal-600 dark:text-teal-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 relative z-10">
        Data Gathering in Progress
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-8 relative z-10 leading-relaxed">
        Your behavioral and skill analytics will unlock automatically once you complete a few tasks. OpenShare needs a little more momentum to map your unique work profile.
      </p>

      <button
        onClick={() => navigate('/home')}
        className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
      >
        <Rocket className="w-4 h-4" />
        Go Ship Something
      </button>
    </div>
  );
}

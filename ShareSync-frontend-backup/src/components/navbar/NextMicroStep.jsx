import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import useContextualSuggestions from '../../hooks/useContextualSuggestions';

export default function NextMicroStep() {
  const { suggestion, loading } = useContextualSuggestions();

  if (loading) {
    return (
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400">Loading...</span>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <button
      onClick={suggestion.action}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 transition-all group"
    >
      <span className="text-sm">{suggestion.icon}</span>
      <span className={`text-xs font-medium ${suggestion.color} max-w-[200px] truncate`}>
        {suggestion.label}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-all" />
    </button>
  );
}

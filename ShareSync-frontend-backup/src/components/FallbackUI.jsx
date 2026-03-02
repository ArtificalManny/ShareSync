// src/components/FallbackUI.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// TASK 1.4: Branded Error Display (Error, Not Found, Coming Soon, Offline)
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { AlertTriangle, WifiOff, Clock, Search, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function FallbackUI({ type = 'error', message, retryAction }) {
  const config = {
    error: {
      icon: AlertTriangle,
      title: "Something went wrong",
      defaultMessage: "We're having trouble loading this right now.",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-500/10"
    },
    'not-found': {
      icon: Search,
      title: "Page not found",
      defaultMessage: "The page you're looking for doesn't exist or has been moved.",
      color: "text-slate-500",
      bg: "bg-slate-100 dark:bg-surface-2"
    },
    'coming-soon': {
      icon: Clock,
      title: "Coming Soon",
      defaultMessage: "We're still building this feature. Check back soon!",
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-brand/10"
    },
    offline: {
      icon: WifiOff,
      title: "Connection Lost",
      defaultMessage: "Please check your internet connection and try again.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10"
    }
  };

  const activeConfig = config[type] || config.error;
  const Icon = activeConfig.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center rounded-2xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] shadow-sm">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", activeConfig.bg)}>
        <Icon className={cn("w-8 h-8", activeConfig.color)} />
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 dark:text-text-primary mb-2">
        {activeConfig.title}
      </h2>
      
      <p className="text-sm font-medium text-slate-500 dark:text-text-secondary max-w-sm mb-8">
        {message || activeConfig.defaultMessage}
      </p>
      
      <div className="flex items-center gap-3">
        {retryAction && (
          <button
            onClick={retryAction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-surface-2 dark:hover:bg-surface-3 text-slate-700 dark:text-text-primary text-sm font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        <Link
          to="/home"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(124,58,237,0.2)]"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}

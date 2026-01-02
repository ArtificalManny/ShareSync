import React, { createContext, useContext, useEffect, useState } from 'react';
import { CheckCircle2, TriangleAlert, Info, X, Sparkles, AlertCircle } from 'lucide-react';
import haptic from '../../utils/haptics';

const ToastCtx = createContext({ push: () => {} });

let idCounter = 1;

/**
 * Main toast function
 * Usage: toast({ title: 'Hello', description: 'World', variant: 'success' })
 */
export function toast(input = {}) {
  const opts = typeof input === 'string' ? { title: input } : input || {};
  const { 
    title = '', 
    description = '', 
    variant = 'default', 
    duration = 3500,
    action = null,
  } = opts;

  const ev = new CustomEvent('app:toast', {
    detail: { 
      id: idCounter++, 
      title, 
      description, 
      variant, 
      duration,
      action,
    },
  });
  
  window.dispatchEvent(ev);
  
  // Haptic feedback based on variant
  if (variant === 'success') haptic.success();
  else if (variant === 'error') haptic.error();
  else if (variant === 'warning') haptic.warning();
  else haptic.light();
  
  return ev.detail.id;
}

// Convenience methods
toast.success = (msg, opts = {}) => 
  toast({ 
    title: typeof msg === 'string' ? msg : (msg?.title || 'Success'), 
    description: typeof msg === 'string' ? '' : msg?.description, 
    variant: 'success', 
    ...opts 
  });

toast.error = (msg, opts = {}) => 
  toast({ 
    title: typeof msg === 'string' ? msg : (msg?.title || 'Error'), 
    description: typeof msg === 'string' ? '' : msg?.description, 
    variant: 'error', 
    ...opts 
  });

toast.warning = (msg, opts = {}) => 
  toast({ 
    title: typeof msg === 'string' ? msg : (msg?.title || 'Warning'), 
    description: typeof msg === 'string' ? '' : msg?.description, 
    variant: 'warning', 
    ...opts 
  });

toast.info = (msg, opts = {}) => 
  toast({ 
    title: typeof msg === 'string' ? msg : (msg?.title || 'Info'), 
    description: typeof msg === 'string' ? '' : msg?.description, 
    variant: 'default', 
    ...opts 
  });

// Special toast for AI insights
toast.insight = (msg, opts = {}) => 
  toast({ 
    title: typeof msg === 'string' ? msg : (msg?.title || '💡 Insight'), 
    description: typeof msg === 'string' ? '' : msg?.description, 
    variant: 'insight', 
    duration: 5000,
    ...opts 
  });

const MAX_TOASTS = 3;

const ICON_MAP = { 
  success: CheckCircle2, 
  error: AlertCircle, 
  warning: TriangleAlert,
  default: Info,
  insight: Sparkles,
};

const VARIANT_STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
  error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
  default: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/90 dark:border-slate-700/60 dark:text-slate-300',
  insight: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400',
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    haptic.light();
  };

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts((cur) => {
        const next = [...cur, t];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      
      if (t.duration !== 0) {
        setTimeout(() => remove(t.id), t.duration);
      }
    };
    
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div 
      aria-live="polite" 
      aria-atomic="false" 
      role="region" 
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '400px', width: '90vw' }}
    >
      {toasts.map((t, index) => {
        const Icon = ICON_MAP[t.variant] || ICON_MAP.default;
        const variantClass = VARIANT_STYLES[t.variant] || VARIANT_STYLES.default;

        return (
          <div
            key={t.id}
            role="status"
            tabIndex={0}
            className={`
              modern-card p-4 shadow-lg pointer-events-auto
              animate-slide-up border-l-4
              ${variantClass}
              cursor-pointer hover:shadow-xl transition-all
            `}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => remove(t.id)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {t.title && (
                  <div className="font-semibold text-sm mb-0.5">
                    {t.title}
                  </div>
                )}
                {t.description && (
                  <div className="text-xs opacity-90">
                    {t.description}
                  </div>
                )}
                {t.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      t.action.onClick();
                      remove(t.id);
                    }}
                    className="text-xs font-medium underline hover:no-underline mt-2"
                  >
                    {t.action.label} →
                  </button>
                )}
              </div>

              {/* Close button */}
              <button
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(t.id);
                }}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            {t.duration > 0 && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 origin-left"
                style={{
                  animation: `shrink ${t.duration}ms linear`,
                }}
              />
            )}
          </div>
        );
      })}
      
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const push = (opts) => toast(opts);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <ToastHost />
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

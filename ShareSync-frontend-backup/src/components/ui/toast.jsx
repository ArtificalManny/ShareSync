// src/components/ui/toast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7.2: Toast Notification Audit
// UPGRADED: Replaced linear CSS slide with Framer Motion spring physics.
// The toast now physically "pops" onto the screen for a better reward feel.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CheckCircle2, TriangleAlert, Info, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import haptic from '../../utils/haptics';

const ToastCtx = createContext({ push: () => {} });

let idCounter = 1;

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
  
  if (variant === 'success') haptic.success();
  else if (variant === 'error') haptic.error();
  else if (variant === 'warning') haptic.warning();
  else haptic.light();
  
  return ev.detail.id;
}

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
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
  error: 'bg-red-50 border-red-200 text-red-700 shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
  default: 'bg-slate-50 border-slate-200 text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
  insight: 'bg-violet-50 border-violet-200 text-violet-700 shadow-[0_4px_20px_rgba(139,92,246,0.15)]',
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
      className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: '380px', width: '90vw' }}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON_MAP[t.variant] || ICON_MAP.default;
          const variantClass = VARIANT_STYLES[t.variant] || VARIANT_STYLES.default;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              layout
              role="status"
              className={`
                relative overflow-hidden rounded-xl p-4 pointer-events-auto border
                ${variantClass}
                cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]
              `}
              onClick={() => remove(t.id)}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon strokeWidth={2} className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  {t.title && (
                    <div className="font-semibold text-[14px] leading-tight mb-1">
                      {t.title}
                    </div>
                  )}
                  {t.description && (
                    <div className="text-[13px] font-medium opacity-90 leading-snug">
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
                      className="text-xs font-bold underline hover:no-underline mt-2 opacity-90"
                    >
                      {t.action.label} →
                    </button>
                  )}
                </div>

                <button
                  className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-1 -mr-2 -mt-1 rounded-md hover:bg-black/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                  }}
                >
                  <X strokeWidth={2} className="w-4 h-4" />
                </button>
              </div>

              {t.duration > 0 && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 origin-left"
                  style={{ animation: `shrink ${t.duration}ms linear` }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      
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

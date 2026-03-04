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
    duration = 4000,
    action = null,
  } = opts;

  const ev = new CustomEvent('app:toast', {
    detail: { id: idCounter++, title, description, variant, duration, action },
  });
  
  window.dispatchEvent(ev);
  
  if (variant === 'success' || variant === 'xp') haptic.success();
  else if (variant === 'error') haptic.error();
  else if (variant === 'warning') haptic.warning();
  else haptic.light();
  
  return ev.detail.id;
}

toast.success = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Success'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'success', ...opts });
toast.error = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Error'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'error', ...opts });
toast.warning = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Warning'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'warning', ...opts });
toast.info = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Info'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'default', ...opts });
toast.insight = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || '💡 Insight'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'insight', duration: 5000, ...opts });
toast.xp = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || '+ XP Earned'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'xp', duration: 4000, ...opts });

const MAX_TOASTS = 3;

const ICON_MAP = { 
  success: CheckCircle2, 
  error: AlertCircle, 
  warning: TriangleAlert,
  default: Info,
  insight: Sparkles,
  xp: Sparkles,
};

// ⭐ Premium Glass Morphism Styles
const VARIANT_STYLES = {
  success: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  error: 'bg-red-50/90 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400',
  warning: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
  default: 'bg-slate-50/90 dark:bg-[#1f1f23]/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300',
  insight: 'bg-indigo-50/90 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  xp: 'bg-violet-50/90 dark:bg-violet-900/30 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]',
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts((cur) => {
        const next = [...cur, t];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      if (t.duration > 0) setTimeout(() => remove(t.id), t.duration);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div 
      aria-live="polite" aria-atomic="false" role="region" aria-label="Notifications"
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON_MAP[t.variant] || ICON_MAP.default;
          const variantClass = VARIANT_STYLES[t.variant] || VARIANT_STYLES.default;

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-colors ${variantClass}`}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0 mt-0.5"><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  {t.title && <div className="font-bold text-sm mb-0.5 tracking-tight">{t.title}</div>}
                  {t.description && <div className="text-xs font-medium opacity-80 leading-relaxed">{t.description}</div>}
                  {t.action && (
                    <button onClick={(e) => { e.stopPropagation(); t.action.onClick(); remove(t.id); }} className="text-xs font-bold underline hover:no-underline mt-2 inline-block">
                      {t.action.label} →
                    </button>
                  )}
                </div>
                <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Smooth shrinking progress bar */}
              {t.duration > 0 && (
                <motion.div 
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 origin-left"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
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

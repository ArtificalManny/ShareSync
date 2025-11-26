// src/components/ui/toast.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CheckCircle2, TriangleAlert, Info, X } from 'lucide-react';

const ToastCtx = createContext({ push: () => {} });

let idCounter = 1;

export function toast(input = {}) {
  const opts = typeof input === 'string' ? { title: input } : input || {};
  const { title = '', description = '', variant = 'default', timeout = 3500 } = opts;

  const ev = new CustomEvent('app:toast', {
    detail: { id: idCounter++, title, description, variant, timeout },
  });
  window.dispatchEvent(ev);
  return ev.detail.id;
}

toast.success = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Success'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'success', ...opts });
toast.error = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Something went wrong'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'error', ...opts });
toast.info = (msg, opts = {}) => toast({ title: typeof msg === 'string' ? msg : (msg?.title || 'Notice'), description: typeof msg === 'string' ? '' : msg?.description, variant: 'default', ...opts });

const MAX_TOASTS = 3;
const ICON = { success: CheckCircle2, error: TriangleAlert, default: Info };

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts((cur) => {
        const next = [...cur, t];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      if (t.timeout !== 0) setTimeout(() => remove(t.id), t.timeout);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div aria-live="polite" aria-atomic="false" role="region" aria-label="Notifications" className="toast-stack">
      {toasts.map((t) => {
        const Icon = ICON[t.variant] || ICON.default;
        const kindClass = t.variant === 'success' ? 'toast--success' : t.variant === 'error' ? 'toast--error' : 'toast--default';

        return (
          <div key={t.id} role="status" tabIndex={0} className={`toast ${kindClass}`} onClick={() => remove(t.id)}>
            <div className="toast__icon" aria-hidden><Icon className="h-4 w-4" /></div>
            <div className="toast__content">
              {t.title && <div className="toast__title">{t.title}</div>}
              {t.description && <div className="toast__desc">{t.description}</div>}
            </div>
            <button className="toast__close" aria-label="Dismiss notification" onClick={(e) => { e.stopPropagation(); remove(t.id); }} title="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
            {t.timeout > 0 && <span className="toast__progress" style={{ animationDuration: `${t.timeout}ms` }} aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

export default function ToastProvider({ children }) {
  const push = (opts) => toast(opts);
  return <ToastCtx.Provider value={{ push }}>{children}</ToastCtx.Provider>;
}

export const useToast = () => useContext(ToastCtx);
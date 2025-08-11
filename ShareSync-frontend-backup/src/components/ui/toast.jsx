// /src/components/ui/toast.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const ToastCtx = createContext({ push: () => {} });

let idCounter = 1;
export function toast({ title, description, variant = 'default', timeout = 3500 } = {}) {
  const ev = new CustomEvent('app:toast', {
    detail: { id: idCounter++, title, description, variant, timeout },
  });
  window.dispatchEvent(ev);
}

export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts((cur) => [...cur, t]);
      if (t.timeout !== 0) setTimeout(() => remove(t.id), t.timeout);
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
      className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          tabIndex={0}
          className={`rounded-xl border px-4 py-3 shadow-md max-w-sm outline-none ${
            t.variant === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : t.variant === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {t.title && <div className="font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm mt-0.5">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}

export default function ToastProvider({ children }) {
  const push = (opts) => toast(opts);
  return <ToastCtx.Provider value={{ push }}>{children}</ToastCtx.Provider>;
}

export const useToast = () => useContext(ToastCtx);

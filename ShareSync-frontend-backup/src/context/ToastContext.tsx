// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

type ToastContextType = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 5000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm rounded-lg p-3 shadow-lg text-sm font-medium transition-all ${
              t.variant === 'destructive'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-white'
            }`}
          >
            <div>{t.title}</div>
            {t.description && <div className="text-xs opacity-90 mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto-dismiss after duration (default 5s)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 5000);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-3"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  action,
}) => {
  // MetaLab elevation tones + semantic colors
  const typeStyles = {
    success: {
      bg: 'bg-metalab-elevated',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      glow: 'shadow-glow-success',
      Icon: CheckCircle,
    },
    error: {
      bg: 'bg-metalab-elevated',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      glow: 'shadow-glow-danger',
      Icon: XCircle,
    },
    warning: {
      bg: 'bg-metalab-elevated',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
      glow: 'shadow-glow-warning',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-metalab-elevated',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      glow: 'shadow-glow-info',
      Icon: Info,
    },
  };

  const style = typeStyles[type];
  const IconComponent = style.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className={`
        ${style.bg} ${style.border} ${style.glow}
        backdrop-blur-2xl
        border
        rounded-xl
        p-4
        min-w-[320px] max-w-md
        shadow-xl
        relative
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.icon}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm leading-tight">
            {title}
          </h4>
          {message && (
            <p className="text-slate-300 text-sm mt-1 leading-snug">
              {message}
            </p>
          )}
          
          {/* Optional action button */}
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
              }}
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              {action.label}
            </motion.button>
          )}
        </div>

        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
          onClick={onClose}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Toast;

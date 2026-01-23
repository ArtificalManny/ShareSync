// src/components/common/Toast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC TOAST v2.0 - Phase 1: Emotional Color System
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - Deep Violet brand glow for info/brand toasts
// - Mint (#10B981) for success
// - Amber (#F59E0B) for warning  
// - Red (#EF4444) for error
// - Electric Cyan (#06B6D4) for live/realtime notifications
// - Coral (#F43F5E) for energy/celebration toasts
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Zap,
  Radio,
  PartyPopper
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

  // Convenience methods for different toast types
  const toast = {
    success: (title, message, options = {}) => 
      addToast({ type: 'success', title, message, ...options }),
    error: (title, message, options = {}) => 
      addToast({ type: 'error', title, message, ...options }),
    warning: (title, message, options = {}) => 
      addToast({ type: 'warning', title, message, ...options }),
    info: (title, message, options = {}) => 
      addToast({ type: 'info', title, message, ...options }),
    live: (title, message, options = {}) => 
      addToast({ type: 'live', title, message, ...options }),
    energy: (title, message, options = {}) => 
      addToast({ type: 'energy', title, message, ...options }),
    celebration: (title, message, options = {}) => 
      addToast({ type: 'celebration', title, message, ...options }),
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
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

// Toast type configurations using new Emotional Color System
const TOAST_STYLES = {
  success: {
    bg: 'bg-surface-1',
    border: 'border-success-500/30',
    iconBg: 'bg-success-500/10',
    icon: 'text-success-500',
    glow: 'shadow-[0_0_20px_rgb(16_185_129/0.15)]',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-surface-1',
    border: 'border-error-500/30',
    iconBg: 'bg-error-500/10',
    icon: 'text-error-500',
    glow: 'shadow-[0_0_20px_rgb(239_68_68/0.15)]',
    Icon: XCircle,
  },
  warning: {
    bg: 'bg-surface-1',
    border: 'border-warning-500/30',
    iconBg: 'bg-warning-500/10',
    icon: 'text-warning-500',
    glow: 'shadow-[0_0_20px_rgb(245_158_11/0.15)]',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-surface-1',
    border: 'border-brand-500/30',
    iconBg: 'bg-brand-500/10',
    icon: 'text-brand-500',
    glow: 'shadow-[0_0_20px_rgb(124_58_237/0.15)]',
    Icon: Info,
  },
  live: {
    bg: 'bg-surface-1',
    border: 'border-live-500/30',
    iconBg: 'bg-live-500/10',
    icon: 'text-live-500',
    glow: 'shadow-[0_0_20px_rgb(6_182_212/0.15)]',
    Icon: Radio,
  },
  energy: {
    bg: 'bg-surface-1',
    border: 'border-energy-500/30',
    iconBg: 'bg-energy-500/10',
    icon: 'text-energy-500',
    glow: 'shadow-[0_0_20px_rgb(244_63_94/0.15)]',
    Icon: Zap,
  },
  celebration: {
    bg: 'bg-surface-1',
    border: 'border-brand-500/30',
    iconBg: 'bg-gradient-to-br from-brand-500/20 to-energy-500/20',
    icon: 'text-brand-400',
    glow: 'shadow-[0_0_25px_rgb(124_58_237/0.20)]',
    Icon: PartyPopper,
  },
};

const Toast = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  action,
}) => {
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
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
        ${style.bg} ${style.glow}
        backdrop-blur-xl
        border ${style.border}
        rounded-xl
        p-4
        min-w-[320px] max-w-md
        shadow-xl
        relative
        overflow-hidden
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Subtle top accent line */}
      <div 
        className={`
          absolute top-0 left-0 right-0 h-[2px]
          ${type === 'success' ? 'bg-gradient-to-r from-success-500/50 to-success-400/30' : ''}
          ${type === 'error' ? 'bg-gradient-to-r from-error-500/50 to-error-400/30' : ''}
          ${type === 'warning' ? 'bg-gradient-to-r from-warning-500/50 to-warning-400/30' : ''}
          ${type === 'info' ? 'bg-gradient-to-r from-brand-500/50 to-brand-400/30' : ''}
          ${type === 'live' ? 'bg-gradient-to-r from-live-500/50 to-live-400/30' : ''}
          ${type === 'energy' ? 'bg-gradient-to-r from-energy-500/50 to-energy-400/30' : ''}
          ${type === 'celebration' ? 'bg-gradient-to-r from-brand-500/50 via-energy-500/40 to-brand-400/30' : ''}
        `}
      />

      <div className="flex items-start gap-3">
        {/* Icon with background */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg
          flex items-center justify-center
          ${style.iconBg}
        `}>
          <IconComponent className={`w-4 h-4 ${style.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-text-primary font-semibold text-sm leading-tight">
            {title}
          </h4>
          {message && (
            <p className="text-text-secondary text-sm mt-1 leading-snug">
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
          className="flex-shrink-0 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Toast;

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE TOAST FUNCTION (for use outside React)
// ═══════════════════════════════════════════════════════════════════════════════
let toastRef = null;

export const setToastRef = (ref) => {
  toastRef = ref;
};

export const toast = {
  success: (title, message, options) => toastRef?.toast.success(title, message, options),
  error: (title, message, options) => toastRef?.toast.error(title, message, options),
  warning: (title, message, options) => toastRef?.toast.warning(title, message, options),
  info: (title, message, options) => toastRef?.toast.info(title, message, options),
  live: (title, message, options) => toastRef?.toast.live(title, message, options),
  energy: (title, message, options) => toastRef?.toast.energy(title, message, options),
  celebration: (title, message, options) => toastRef?.toast.celebration(title, message, options),
};

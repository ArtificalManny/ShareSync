// src/layouts/AuthLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// THE GLASS FORTRESS - Shared Auth Layout
// Aurora background + glassmorphic card container
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Spring physics for natural-feeling animations
const springs = {
  smooth: { type: 'spring', stiffness: 300, damping: 25 },
  heavy: { type: 'spring', stiffness: 200, damping: 20 },
};

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center relative overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          AURORA BACKGROUND — Subtle gradient mesh showing the app is "alive"
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary aurora blob */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute -bottom-1/4 -left-1/4
            w-[800px] h-[800px]
            rounded-full
            bg-gradient-to-tr from-purple-600/20 via-purple-500/10 to-transparent
            blur-3xl
          "
        />
        
        {/* Secondary aurora blob */}
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="
            absolute -top-1/4 -right-1/4
            w-[600px] h-[600px]
            rounded-full
            bg-gradient-to-bl from-fuchsia-600/15 via-transparent to-transparent
            blur-3xl
          "
        />

        {/* Tertiary accent blob */}
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
          className="
            absolute top-1/3 left-1/4
            w-[400px] h-[400px]
            rounded-full
            bg-gradient-to-r from-violet-500/10 to-transparent
            blur-3xl
          "
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          THE GLASS CARD — Centered glassmorphic panel
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.heavy}
        className="
          relative z-10
          w-full max-w-md mx-4
          p-8 rounded-2xl
          bg-white/[0.03] backdrop-blur-xl
          border border-white/[0.08]
          shadow-2xl shadow-black/40
        "
      >
        {/* Logo */}
        <motion.div 
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              ShareSync
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-semibold text-white mb-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Content with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.smooth}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ShareSync. Ship with momentum.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH FORM COMPONENTS — Reusable styled inputs
// ═══════════════════════════════════════════════════════════════════════════════

export function AuthInput({ 
  icon: Icon, 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      )}
      <input
        className={`
          w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-lg
          bg-white/[0.04] 
          border ${error ? 'border-red-500/50' : 'border-white/[0.08]'}
          text-white placeholder:text-slate-500
          focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

export function AuthButton({ 
  children, 
  loading, 
  disabled, 
  variant = 'primary',
  className = '',
  ...props 
}) {
  const baseClasses = `
    w-full py-3 px-4 rounded-xl font-semibold
    flex items-center justify-center gap-2
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-purple-600 to-fuchsia-600 
      hover:from-purple-700 hover:to-fuchsia-700
      text-white shadow-lg shadow-purple-500/25
      hover:shadow-xl hover:shadow-purple-500/30
    `,
    secondary: `
      bg-white/[0.06] border border-white/[0.1]
      hover:bg-white/[0.1] hover:border-white/[0.15]
      text-white
    `,
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {typeof children === 'string' ? children.replace(/^[A-Z]/, 'L') + '...' : 'Loading...'}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2"
    >
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </motion.div>
  );
}

export function AuthDivider({ children }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.08]"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-[#0f0f1a] text-slate-500">
          {children}
        </span>
      </div>
    </div>
  );
}

export function AuthLink({ to, children, className = '' }) {
  // Using regular anchor for now since we're in JSX context
  // The parent component will use react-router-dom Link
  return (
    <span className={`text-purple-400 hover:text-purple-300 cursor-pointer transition-colors ${className}`}>
      {children}
    </span>
  );
}

export default AuthLayout;

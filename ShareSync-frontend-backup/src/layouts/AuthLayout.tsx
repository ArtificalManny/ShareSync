// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC AUTH LAYOUT - The Glass Fortress
// Shared container for all authentication pages with aurora background
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/motion';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optional footer content (e.g., "Already have an account? Sign in") */
  footer?: React.ReactNode;
  /** Unique key for AnimatePresence transitions between auth states */
  transitionKey?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AURORA BACKGROUND COMPONENT
// Animated gradient mesh showing the app is "alive"
// ─────────────────────────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary aurora blob - bottom left */}
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
          bg-gradient-to-tr from-brand-500/20 via-brand-500/5 to-transparent 
          blur-3xl
        "
      />

      {/* Secondary aurora blob - top right */}
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
          bg-gradient-to-bl from-purple-600/10 via-transparent to-transparent 
          blur-3xl
        "
      />

      {/* Tertiary accent blob - center right (subtle) */}
      <motion.div
        animate={{
          x: [0, 20, 0],
          y: [0, -40, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        className="
          absolute top-1/3 -right-1/4 
          w-[400px] h-[400px] 
          rounded-full
          bg-gradient-to-l from-brand-400/10 via-transparent to-transparent 
          blur-3xl
        "
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <motion.div
      className="flex justify-center mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2">
        {/* Logo mark */}
        <div 
          className="
            w-10 h-10 rounded-xl 
            bg-gradient-to-br from-brand-500 to-brand-600
            flex items-center justify-center
            shadow-lg shadow-brand-500/25
          "
        >
          <span className="text-white font-bold text-lg">S</span>
        </div>
        {/* Wordmark */}
        <span className="text-xl font-semibold text-text-primary">
          ShareSync
        </span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  footer,
  transitionKey,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center relative overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground />

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
          p-8 
          rounded-2xl
          bg-white/[0.03] 
          backdrop-blur-xl 
          border border-white/[0.08]
          shadow-2xl shadow-black/20
        "
      >
        {/* Inner glow effect */}
        <div 
          className="
            absolute inset-0 rounded-2xl 
            bg-gradient-to-b from-white/[0.02] to-transparent 
            pointer-events-none
          " 
        />

        {/* Logo */}
        <Logo />

        {/* Title & Subtitle */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Content with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionKey || title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.smooth}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Optional footer (e.g., links to other auth pages) */}
        {footer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-6 border-t border-white/[0.06] text-center"
          >
            {footer}
          </motion.div>
        )}
      </motion.div>

      {/* Page footer */}
      <div className="absolute bottom-6 text-center text-xs text-text-tertiary">
        © {new Date().getFullYear()} ShareSync. Ship with momentum.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CARD SECTION
// Use within AuthLayout for grouped form sections
// ─────────────────────────────────────────────────────────────────────────────

interface AuthSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthSection({ children, className = '' }: AuthSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH DIVIDER
// "or" divider for social login options
// ─────────────────────────────────────────────────────────────────────────────

interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = 'or' }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.06]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-3 bg-surface-0/50 text-text-tertiary backdrop-blur-sm">
          {text}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH LINK
// Styled link for navigation between auth pages
// ─────────────────────────────────────────────────────────────────────────────

interface AuthLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export function AuthLink({ href, children, onClick }: AuthLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="
        text-sm text-brand-400 
        hover:text-brand-300 
        transition-colors duration-150
        hover:underline underline-offset-2
      "
    >
      {children}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default AuthLayout;

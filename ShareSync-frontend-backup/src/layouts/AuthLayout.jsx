// src/layouts/AuthLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH LAYOUT + SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
//
// Path B implementation:
// - Restore the lighter auth-page feel
// - Keep the existing component/export API intact
// - Replace the tiny brand symbol with OpenShareLogo
// - No backend or auth-logic changes
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { motion } from "framer-motion";
import OpenShareLogo from "../components/ui/OpenShareLogo";

// Shared classnames
export const AUTH_CARD =
  "w-full max-w-md rounded-[32px] " +
  "bg-white " +
  "shadow-[0_24px_80px_rgba(15,23,42,0.10)] " +
  "ring-1 ring-slate-200/70 " +
  "px-8 py-8 sm:px-10 sm:py-9";

export const AUTH_INPUT =
  "w-full px-4 py-2.5 rounded-xl " +
  "bg-white " +
  "ring-1 ring-slate-200 " +
  "text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-transparent " +
  "transition-all duration-200";

export const AUTH_INPUT_WITH_ICON =
  "w-full pl-10 pr-4 py-2.5 rounded-xl " +
  "bg-white " +
  "ring-1 ring-slate-200 " +
  "text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-transparent " +
  "transition-all duration-200";

// Layout shell
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout fixed inset-0 w-screen h-screen overflow-x-hidden overflow-y-auto bg-slate-50">
      {/* Light atmospheric background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 52%, #F8FAFC 100%)",
          }}
        />

        {/* Left violet glow */}
        <div
          className="absolute -top-[10%] -left-[12%] w-[48vw] h-[48vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.05) 32%, transparent 72%)",
            filter: "blur(40px)",
          }}
        />

        {/* Right soft violet wash */}
        <div
          className="absolute top-0 right-0 h-full w-[28vw]"
          style={{
            background:
              "linear-gradient(180deg, rgba(244,240,255,0.9) 0%, rgba(243,232,255,0.75) 100%)",
          }}
        />
      </div>

      {/* Centered content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={AUTH_CARD}
        >
            {/* OpenShare brand lockup */}
            <div className="mb-7 flex justify-center select-none">
              <OpenShareLogo
                variant="lockup"
                className="justify-center"
                markClassName="w-12 h-12 shrink-0"
                wordmarkClassName="text-[1.55rem] sm:text-[1.7rem]"
                title="OpenShare"
              />
            </div>

            {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em] text-slate-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>

          {/* Page content */}
          {children}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400">
            © 2026 OpenShare. Ship with momentum.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Button
export function AuthButton({
  children,
  loading,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "w-full inline-flex items-center justify-center gap-2 " +
    "py-3 px-4 rounded-xl font-semibold " +
    "transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/20 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "secondary"
      ? "bg-violet-50 ring-1 ring-violet-200 text-violet-700 hover:bg-violet-100"
      : "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-[1.03] shadow-[0_12px_32px_rgba(244,63,94,0.24)]";

  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-current/70 border-t-transparent animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Error
export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-600">
      {children}
    </div>
  );
}

// Success
export function AuthSuccess({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-700">
      {children}
    </div>
  );
}

// Optional input wrapper
export function AuthInput({ label, icon: Icon, error, className = "", ...props }) {
  return (
    <div>
      {label ? (
        <label className="block text-sm font-medium text-slate-600 mb-1.5">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        ) : null}

        <input
          {...props}
          className={`${Icon ? AUTH_INPUT_WITH_ICON : AUTH_INPUT} ${
            error ? "ring-red-300 focus:ring-red-500/20" : ""
          } ${className}`}
        />
      </div>

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

// Default export
export default AuthLayout;

// src/layouts/AuthLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Depth & Glassmorphism Audit
// Increased backdrop blur, deeper base shadow, crisp 1px top highlight, 
// and recessed inner shadow on inputs.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const AUTH_CARD =
  "w-full max-w-md rounded-3xl " +
  "bg-[#070712]/40 backdrop-blur-2xl " +
  "shadow-[0_30px_100px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] " +
  "ring-1 ring-white/[0.05] " +
  "px-8 py-8";

export const AUTH_INPUT =
  "w-full px-4 py-2.5 rounded-xl " +
  "bg-black/20 backdrop-blur-md " +
  "shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)] " +
  "ring-1 ring-white/[0.05] " +
  "text-white placeholder:text-slate-500 " +
  "focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-transparent " +
  "transition-all duration-200";

export const AUTH_INPUT_WITH_ICON =
  "w-full pl-10 pr-4 py-2.5 rounded-xl " +
  "bg-black/20 backdrop-blur-md " +
  "shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)] " +
  "ring-1 ring-white/[0.05] " +
  "text-white placeholder:text-slate-500 " +
  "focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-transparent " +
  "transition-all duration-200";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout fixed inset-0 w-screen h-screen overflow-hidden bg-[#070712]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#070712]" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700/30 via-purple-700/12 to-transparent" />
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-600/20 blur-[110px]" />
        <div className="absolute -bottom-48 -right-48 w-[620px] h-[620px] rounded-full bg-fuchsia-500/12 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0)_55%)]" />
      </div>

      <div className="relative h-full flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={AUTH_CARD}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 ring-1 ring-purple-500/25 flex items-center justify-center">
              <Sparkles strokeWidth={1.5} className="w-5 h-5 text-purple-300 shrink-0" />
            </div>
            <div className="text-lg font-semibold tracking-wide text-purple-200">
              OpenShare
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            ) : null}
          </div>

          {children}

          <div className="mt-8 text-center text-xs text-slate-500">
            © 2026 OpenShare. Ship with momentum.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

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
    "transition-all duration-200 active:translate-y-[1px] active:shadow-none " +
    "focus:outline-none focus:ring-2 focus:ring-purple-500/25 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "secondary"
      ? "bg-white/[0.05] ring-1 ring-white/[0.10] text-white hover:bg-white/[0.07]"
      : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:brightness-[1.07] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_16px_rgba(147,51,234,0.3)]";

  return (
    <button className={`${base} ${styles} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-200">
      {children}
    </div>
  );
}

export function AuthSuccess({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 px-4 py-3 text-sm text-emerald-200">
      {children}
    </div>
  );
}

export function AuthInput({ label, icon: Icon, error, className = "", ...props }) {
  return (
    <div>
      {label ? (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 shrink-0" />
        ) : null}

        <input
          {...props}
          className={`${Icon ? AUTH_INPUT_WITH_ICON : AUTH_INPUT} ${error ? "ring-red-500/30 focus:ring-red-500/25" : ""} ${className}`}
        />
      </div>

      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

export default AuthLayout;

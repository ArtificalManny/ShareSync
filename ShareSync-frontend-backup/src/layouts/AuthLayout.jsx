// src/layouts/AuthLayout.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const AUTH_CARD =
  "w-full max-w-md rounded-3xl !bg-white " +
  "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] " +
  "border border-slate-200 " +
  "px-8 py-10 relative z-10 mt-auto mb-auto";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout relative min-h-screen w-full !bg-slate-50 !text-slate-900 font-sans overflow-y-auto overflow-x-hidden">
      
      {/* Light Mode Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 !bg-slate-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 opacity-80" />
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-violet-200/50 blur-[100px]" />
        <div className="absolute -bottom-48 -right-48 w-[620px] h-[620px] rounded-full bg-fuchsia-200/40 blur-[100px]" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className={AUTH_CARD}>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">OpenShare</div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold !text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm !text-slate-500">{subtitle}</p>}
          </div>

          {children}

          <div className="mt-8 text-center text-xs !text-slate-400">© 2026 OpenShare. Ship with momentum.</div>
        </motion.div>
      </div>
    </div>
  );
}

export function AuthButton({ children, loading, variant = "primary", className = "", ...props }) {
  const base = "w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = variant === "secondary"
    ? "!bg-white border-2 !border-slate-200 !text-slate-700 hover:!bg-slate-50 hover:!border-slate-300 shadow-sm"
    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 !text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0";
  
  return (
    <button className={`${base} ${styles} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70" />Wait...</span> : children}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return <div className="rounded-xl !bg-red-50 border !border-red-200 px-4 py-3 text-sm !text-red-700 font-medium flex items-center gap-2 mb-4">{children}</div>;
}

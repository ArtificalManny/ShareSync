// src/pages/Login.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Login Page
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, AuthButton, AuthError } from "../layouts/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN SUBMIT
  // ⚠️ PRESERVING EXISTING useAuth().login() CALL - DO NOT MODIFY
  // ─────────────────────────────────────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    
    setSubmitting(true);
    try {
      // ⚠️ EXISTING AUTH CALL - PRESERVED
      const result = await login({ email, password });
      
      if (result.success) {
        navigate("/home", { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Check your credentials.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue shipping"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthError>{error}</AuthError>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-white/[0.04] border border-white/[0.08]
                text-white placeholder:text-slate-500
                focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full pl-10 pr-10 py-2.5 rounded-lg
                bg-white/[0.04] border border-white/[0.08]
                text-white placeholder:text-slate-500
                focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
                transition-all duration-200
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="
              w-4 h-4 rounded 
              border-white/20 bg-white/[0.04]
              text-purple-500 
              focus:ring-purple-500 focus:ring-offset-0
            "
          />
          <label htmlFor="remember" className="text-sm text-slate-400">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <AuthButton type="submit" loading={submitting}>
          Sign In
          <ArrowRight className="w-5 h-5" />
        </AuthButton>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0f0f1a] text-slate-500">
              New to ShareSync?
            </span>
          </div>
        </div>

        {/* Create Account */}
        <AuthButton variant="secondary" onClick={() => navigate('/create-account')}>
          <UserPlus className="w-5 h-5" />
          Create an account
        </AuthButton>

        {/* Terms */}
        <p className="text-center text-xs text-slate-500">
          By continuing, you agree to ShareSync's{' '}
          <Link to="#" className="text-purple-400 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="#" className="text-purple-400 hover:underline">Privacy Policy</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

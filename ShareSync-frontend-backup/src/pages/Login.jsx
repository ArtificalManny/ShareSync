// src/pages/Login.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Login Page
// Frontend-only polish: Pristine Light Mode & High Contrast CTA
// NO auth logic changed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <AuthLayout title="Welcome back" subtitle="Sign in to continue shipping">
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthError>{error}</AuthError>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full pl-10 pr-4 py-3 rounded-xl font-medium
                bg-white border-2 border-slate-200
                text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                hover:border-slate-300 transition-all duration-200 shadow-sm
              "
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full pl-10 pr-10 py-3 rounded-xl font-medium
                bg-white border-2 border-slate-200
                text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                hover:border-slate-300 transition-all duration-200 shadow-sm
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="
              w-4 h-4 rounded cursor-pointer
              border-2 border-slate-300 bg-white
              text-violet-600
              focus:ring-violet-500/25 focus:ring-offset-0 transition-colors
            "
          />
          <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit CTA - High Contrast Purple */}
        <AuthButton 
          type="submit" 
          loading={submitting}
          className="!bg-violet-600 hover:!bg-violet-700 !text-white !border-none !shadow-lg !shadow-violet-600/30 transition-all duration-200"
        >
          Sign In
          <ArrowRight className="w-5 h-5" />
        </AuthButton>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">
              New to OpenShare?
            </span>
          </div>
        </div>

        {/* Create Account */}
        <AuthButton variant="secondary" type="button" onClick={() => navigate("/create-account")}>
          <UserPlus className="w-5 h-5" />
          Create an account
        </AuthButton>

        {/* Terms */}
        <p className="text-center text-xs text-slate-500 pt-2">
          By continuing, you agree to OpenShare&apos;s{" "}
          <Link to="#" className="text-violet-600 font-medium hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="#" className="text-violet-600 font-medium hover:underline">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

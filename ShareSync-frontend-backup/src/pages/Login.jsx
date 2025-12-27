// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, ArrowRight, UserPlus, KeyRound } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      // ✅ CRITICAL FIX: Pass email and password as separate arguments, not as an object
      const result = await login(email, password);
      
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
    <main className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-8 min-h-screen grid place-items-center">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-2">
            ShareSync
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ship outcomes that matter
          </p>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
            Welcome back
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mb-6">
            <Link
              to="/forgot-password"
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors flex items-center gap-1 group"
            >
              <KeyRound className="w-4 h-4" />
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white py-3 font-semibold disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Log In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                New to ShareSync?
              </span>
            </div>
          </div>

          {/* Create Account Link */}
          <Link
            to="/create-account"
            className="w-full rounded-xl border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 py-3 font-semibold transition-all flex items-center justify-center gap-2 group"
          >
            <UserPlus className="w-5 h-5" />
            Create an account
          </Link>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          By continuing, you agree to ShareSync's{" "}
          <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Login Page
// Frontend-only polish:
// - ShareSync → OpenShare copy
// - Divider bg made transparent (less "boxed")
// - Google OAuth sign-in button
// - NO auth logic changed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, AuthButton, AuthError } from "../layouts/AuthLayout";
import useDocumentTitle from "../hooks/useDocumentTitle";

function getLoginErrorMessage({
  status,
  message,
  networkError = false,
} = {}) {
  const rawMessage = String(message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("verify your email") ||
    normalized.includes("email not verified")
  ) {
    return "Please verify your email before signing in.";
  }

  if (normalized.includes("account suspended")) {
    return "Your account is temporarily suspended. Please try again later.";
  }

  if (normalized.includes("account disabled")) {
    return "This account is currently disabled.";
  }

  if (normalized.includes("account banned")) {
    return "This account is unavailable.";
  }

  if (
    Number(status) === 429 ||
    normalized.includes("too many")
  ) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }

  if (
    Number(status) === 401 ||
    normalized === "unauthorized" ||
    normalized.includes("invalid credentials") ||
    normalized.includes("incorrect credentials")
  ) {
    return "Email or password is incorrect. Please try again.";
  }

  if (networkError) {
    return "We couldn't reach OpenShare. Check your connection and try again.";
  }

  if (Number(status) >= 500) {
    return "OpenShare is having trouble signing you in. Please try again in a moment.";
  }

  return "We couldn't sign you in. Please check your details and try again.";
}

function getGoogleOAuthUrl() {
  const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
  const base = String(rawBase).replace(/\/+$/, "");

  // Supports both:
  // VITE_API_URL=http://localhost:5050
  // VITE_API_URL=http://localhost:5050/api
  if (base.endsWith("/api")) {
    return `${base}/auth/google`;
  }

  return `${base}/api/auth/google`;
}


function isOpenShareHealthPayload(payload) {
  return (
    payload?.ok === true ||
    (
      payload?.success === true &&
      String(payload?.status || "").toLowerCase() === "ok"
    )
  );
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// google-oauth-backend-warmup-v1
// Keep users on OpenShare while Render wakes. Only enter the OAuth route
// after OpenShare itself responds with its JSON health payload.
async function waitForOpenShareBackendReady(timeoutMs = 40000) {
  const oauthUrl = getGoogleOAuthUrl();
  const healthUrl = oauthUrl.replace(/\/auth\/google$/, "/health");
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${healthUrl}?oauthWake=${Date.now()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const contentType = String(
        response.headers.get("content-type") || ""
      ).toLowerCase();

      if (response.ok && contentType.includes("application/json")) {
        const payload = await response.json();

        if (isOpenShareHealthPayload(payload)) {
          return true;
        }
      }
    } catch {
      // Render's cold-start response may fail CORS or the request may time out.
      // Stay on OpenShare and retry until the bounded deadline.
    } finally {
      window.clearTimeout(timeout);
    }

    await sleep(1200);
  }

  return false;
}

export default function Login() {
  useDocumentTitle("OpenShare");
  const navigate = useNavigate();
  const [googleConnecting, setGoogleConnecting] = useState(false);

  const getPostLoginRedirect = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("redirect");
      const fromSession = sessionStorage.getItem("openshare.pendingInviteRedirect");
      const fromLocal = localStorage.getItem("openshare.postLoginRedirect");
      const redirectTo = fromUrl || fromSession || fromLocal || "/home";

      if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        return redirectTo;
      }
    } catch {}

    return "/home";
  };

  const clearPostLoginRedirect = () => {
    try {
      sessionStorage.removeItem("openshare.pendingInviteRedirect");
      localStorage.removeItem("openshare.postLoginRedirect");
    } catch {}
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const deletedFromBackend = params.get("accountDeleted") === "1";

      if (deletedFromBackend) {
        // google-account-delete-session-cleanup-v1
        // Preserve the one-time farewell across the clean reload.
        try {
          sessionStorage.setItem("openshare.accountDeleted", "1");
        } catch {}

        // GoogleCallback and AuthContext have historically used several
        // aliases. Remove all of them before reinitializing the app.
        try {
          [
            "ss.jwt",
            "ss.token",
            "token",
            "authToken",
            "accessToken",
            "ss.user",
            "user",
          ].forEach((key) => localStorage.removeItem(key));
        } catch {}

        params.delete("accountDeleted");

        const query = params.toString();
        const cleanUrl =
          `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;

        // Full reload guarantees AuthProvider starts with no stale deleted-user
        // state or Authorization header in memory.
        window.location.replace(cleanUrl);
        return;
      }

      if (sessionStorage.getItem("openshare.accountDeleted") === "1") {
        setAccountDeleted(true);
        sessionStorage.removeItem("openshare.accountDeleted");
      }
    } catch {
      // The deletion itself already succeeded; this banner is best-effort.
    }

    const redirectTo = getPostLoginRedirect();

    if (redirectTo !== "/home") {
      try {
        sessionStorage.setItem("openshare.pendingInviteRedirect", redirectTo);
        localStorage.setItem("openshare.postLoginRedirect", redirectTo);
      } catch {}
    }
  }, []);

  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accountDeleted, setAccountDeleted] = useState(false);

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
        {
          const redirectTo = getPostLoginRedirect();
          clearPostLoginRedirect();
          navigate(redirectTo, { replace: true });
        }
        return;
      }

      if (
        result.needsVerification ||
        String(result.error || result.message || "").toLowerCase().includes("verify your email")
      ) {
        try {
          localStorage.setItem(
            "openshare.pendingVerification",
            JSON.stringify({
              userId: result.userId || null,
              email,
              createdAt: Date.now(),
            }),
          );
        } catch {
          // Ignore storage failures.
        }

        navigate("/verify-email", {
          replace: true,
          state: {
            userId: result.userId || null,
            email,
          },
        });
        return;
      }

      setError(
        getLoginErrorMessage({
          status: result.status || result.statusCode,
          message:
            result.error ||
            result.message ||
            "Login failed",
        }),
      );
    } catch (err) {
      const errorPayload = err?.response?.data?.data ?? err?.response?.data ?? {};
      const msg =
        errorPayload?.message ||
        errorPayload?.error ||
        err?.message ||
        "Login failed. Check your credentials.";

      if (
        errorPayload?.needsVerification ||
        String(msg || "").toLowerCase().includes("verify your email")
      ) {
        try {
          localStorage.setItem(
            "openshare.pendingVerification",
            JSON.stringify({
              userId: errorPayload?.userId || null,
              email,
              createdAt: Date.now(),
            }),
          );
        } catch {
          // Ignore storage failures.
        }

        navigate("/verify-email", {
          replace: true,
          state: {
            userId: errorPayload?.userId || null,
            email,
          },
        });
        return;
      }

      setError(
        getLoginErrorMessage({
          status:
            err?.response?.status ||
            errorPayload?.statusCode,
          message: msg,
          networkError: !err?.response,
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue shipping">

      <form onSubmit={onSubmit} className="space-y-5">
        {accountDeleted && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Your account has been deleted.
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Thanks for building with OpenShare. Take care — and you're always welcome back.
                </p>
              </div>
            </div>
          </div>
        )}

        <AuthError>{error}</AuthError>

        {/* ══════════════════════════════════════════════════════════════════
            GOOGLE SIGN-IN — Redirects to backend Passport OAuth flow
        ══════════════════════════════════════════════════════════════════ */}
        <button
          type="button"
          disabled={googleConnecting || submitting}
          onClick={async () => {
            setError("");
            setGoogleConnecting(true);

            const backendReady = await waitForOpenShareBackendReady();

            if (!backendReady) {
              setError(
                "OpenShare is taking a little longer to connect. Please try Google sign-in again."
              );
              setGoogleConnecting(false);
              return;
            }

            window.location.assign(getGoogleOAuthUrl());
          }}
          className="
            w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl
            bg-white border border-slate-200
            text-slate-700 font-semibold text-sm
            shadow-[0_1px_2px_rgba(15,23,42,0.05)]
            hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_6px_20px_rgba(124,58,237,0.10)]
            active:scale-[0.99]
            transition-all duration-200
          "
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleConnecting ? "Connecting to Google…" : "Continue with Google"}
        </button>

        {/* ── "or" divider ── */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/70" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-400 font-medium">or</span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                w-full pl-10 pr-4 py-3 rounded-2xl
                bg-white border border-slate-200
                text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/60
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-1"
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
                w-full pl-10 pr-10 py-3 rounded-2xl
                bg-white border border-slate-200
                text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/60
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
              border border-slate-300
              bg-white
              text-[#8B5CF6]
              focus:ring-[#8B5CF6]/30 focus:ring-offset-0
            "
          />
          <label htmlFor="remember" className="text-sm text-slate-400">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <AuthButton type="submit" loading={submitting} className="btn-primary">
          Sign In
          <ArrowRight className="w-5 h-5" />
        </AuthButton>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/70" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-400">
              New to OpenShare?
            </span>
          </div>
        </div>

        {/* Create Account */}
        <AuthButton variant="secondary" type="button" onClick={() => navigate("/create-account")} className="btn-secondary">
          <UserPlus className="w-5 h-5" />
          Create an account
        </AuthButton>

        {/* Terms */}
        <p className="text-center text-xs text-slate-500">
          By continuing, you agree to OpenShare&apos;s{" "}
          <Link to="#" className="text-[#7c3aed] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="#" className="text-[#7c3aed] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

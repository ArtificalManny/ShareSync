import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Check, ArrowLeft, RefreshCw } from "lucide-react";
import { AuthLayout, AuthButton, AuthError } from "../layouts/AuthLayout";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { setTokens } from "../utils/tokenUtils";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://openshare-backend.onrender.com/api"
    : "http://localhost:5050/api")
).replace(/\/$/, "");

const PENDING_KEY = "openshare.pendingVerification";

function getPendingVerification(locationState) {
  const fromState = locationState || {};

  if (fromState?.userId) {
    return {
      userId: fromState.userId,
      email: fromState.email || "",
    };
  }

  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
    if (stored?.userId) {
      return {
        userId: stored.userId,
        email: stored.email || "",
      };
    }
  } catch {
    // Ignore bad localStorage data.
  }

  return {
    userId: "",
    email: "",
  };
}

function OTPInput({ value, onChange, length = 6 }) {
  const inputRefs = useRef([]);

  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return;

    const next = value.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, length);

    onChange(joined);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange(pasted);

    if (pasted.length < length) {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoFocus={index === 0}
          className="
            w-12 h-14 text-center text-2xl font-semibold
            bg-white/[0.035] ring-1 ring-white/[0.10] rounded-xl
            text-white
            focus:ring-2 focus:ring-purple-500/25
            focus:outline-none transition-all duration-200
          "
        />
      ))}
    </div>
  );
}

export default function VerifyEmail() {
  useDocumentTitle("Verify Email — OpenShare");

  const navigate = useNavigate();
  const location = useLocation();

  const pending = useMemo(
    () => getPendingVerification(location.state),
    [location.state],
  );

  const [userId] = useState(pending.userId);
  const [email] = useState(pending.email);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(20);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!userId) {
      setError("Missing verification session. Please sign in again.");
      return;
    }

    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      const token =
        data.access_token ||
        data.token;

      const refreshToken =
        data.refresh_token;

      const user = data.user;

      if (!token || !refreshToken || !user) {
        throw new Error(
          "Verification succeeded, but persistent login data was missing.",
        );
      }

      setTokens(
        token,
        refreshToken,
        user,
      );

      localStorage.removeItem(PENDING_KEY);

      // Keep the already-mounted AuthContext in sync before
      // navigating into the authenticated application.
      window.dispatchEvent(
        new CustomEvent(
          "openshare:session-refreshed",
          {
            detail: { user },
          },
        ),
      );

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Verification failed");
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;

    if (!userId) {
      setError("Missing verification session. Please sign in again.");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not resend code");
      }

      setMessage("New verification code sent.");
      setResendCountdown(30);
    } catch (err) {
      setError(err.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  if (!userId) {
    return (
      <AuthLayout title="Verify your email" subtitle="No verification session found">
        <div className="space-y-5 text-center">
          <AuthError>
            We could not find the account waiting for verification. Please sign in again.
          </AuthError>

          <AuthButton type="button" onClick={() => navigate("/login", { replace: true })}>
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify your email" subtitle={email ? `Code sent to ${email}` : "Enter your verification code"}>
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 ring-1 ring-purple-500/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>

          <p className="text-sm text-slate-400">
            We sent a 6-digit code
            {email ? (
              <>
                {" "}to<br />
                <span className="text-white font-medium">{email}</span>
              </>
            ) : (
              "."
            )}
          </p>
        </div>

        <AuthError>{error}</AuthError>

        {message ? (
          <p className="text-center text-sm text-green-400">{message}</p>
        ) : null}

        <OTPInput value={code} onChange={setCode} />

        <button
          type="submit"
          data-openshare-verify-email-submit="visible-v1"
          disabled={submitting || code.length !== 6}
          className="w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          style={{
            backgroundColor: code.length === 6 ? "#7c3aed" : "#ede9fe",
            backgroundImage:
              code.length === 6
                ? "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 34%, #7c3aed 68%, #6d28d9 Available)"
                : "linear-gradient(135deg, #f5f3ff 0%, #ede9fe Available)",
            color: code.length === 6 ? "#ffffff" : "#6d28d9",
            border: "1px solid rgba(139,92,246,0.35)",
            boxShadow:
              code.length === 6
                ? "0 18px 44px rgba(124,58,237,0.32), inset 0 1px 0 rgba(255,255,255,0.34)"
                : "0 8px 20px rgba(124,58,237,0.12)",
            opacity: 1,
          }}
        >
          <Check className="w-5 h-5" />
          {submitting
            ? "Verifying..."
            : code.length === 6
              ? "Verify Email"
              : "Enter 6 digits to verify"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCountdown > 0 || resending}
            className={`inline-flex items-center gap-1 ${
              resendCountdown > 0 || resending
                ? "text-slate-600"
                : "text-purple-400 hover:text-purple-300"
            }`}
          >
            {resending ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Resending...
              </>
            ) : resendCountdown > 0 ? (
              `Resend in ${resendCountdown}s`
            ) : (
              "Resend"
            )}
          </button>
        </p>

        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
      </form>
    </AuthLayout>
  );
}

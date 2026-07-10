// src/pages/CreateAccount.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Create Account Page
// Two-step flow: Data Collection → OTP Verification
// Frontend-only polish:
// - Fix alignment (Last name now matches First name icon/padding)
// - Inputs less "boxed" (rounded-xl + ring)
// - ShareSync → OpenShare copy (Terms)
// - Google OAuth sign-up button
// - NO backend endpoints or auth logic modified
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, X,
  AtSign, ArrowLeft
} from "lucide-react";
import { AuthLayout, AuthButton, AuthError } from "../layouts/AuthLayout";
import useDocumentTitle from "../hooks/useDocumentTitle";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://openshare-backend.onrender.com/api"
    : "http://localhost:5050/api")
).replace(/\/$/, "");


// ═══════════════════════════════════════════════════════════════════════════════
// PASSWORD STRENGTH METER
// ═══════════════════════════════════════════════════════════════════════════════
function PasswordStrengthMeter({ password }) {
  const checks = [
    { label: '8+ chars', valid: password.length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
    { label: 'Special', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.valid).length;
  const colors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-500'];
  const labels = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? colors[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">Password strength</span>
        <span className={`text-xs ${score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
          {labels[score]}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OTP INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function OTPInput({ value, onChange, length = 6 }) {
  const inputRefs = Array(length).fill(0).map(() => React.useRef(null));

  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    const joined = newValue.join('').slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    if (pasted.length < length) {
      inputRefs[pasted.length].current?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(length).fill(0).map((_, i) => (
        <input
          key={i}
          ref={inputRefs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          className="
            w-12 h-14 text-center text-2xl font-semibold
            bg-white ring-1 ring-slate-200 rounded-xl
            text-slate-900
            focus:ring-2 focus:ring-[#8B5CF6]/30
            focus:outline-none transition-all duration-200
          "
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION UI COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function VerificationStep({ email, userId, onVerify, onBack, error, submitting }) {
  const [code, setCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);

  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setResendCountdown(30);
    // Could call resend API here if available
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#8B5CF6]/10 ring-1 ring-[#8B5CF6]/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-[#7c3aed]" />
        </div>
        <p className="text-sm text-slate-400">
          We sent a 6-digit code to<br />
          <span className="text-slate-900 font-medium">{email}</span>
        </p>
      </div>

      <AuthError>{error}</AuthError>

      <OTPInput value={code} onChange={setCode} />

      <button
        type="submit"
        data-openshare-create-verify-submit="visible-v1"
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
          disabled={resendCountdown > 0}
          className={`${resendCountdown > 0 ? 'text-slate-600' : 'text-[#7c3aed] hover:text-[#6d28d9]'}`}
        >
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend'}
        </button>
      </p>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Use a different email
      </button>
    </form>
  );
}

import { OPENSHARE_MESSAGING } from "../content/openShareMessaging";

export default function CreateAccount() {
  useDocumentTitle("OpenShare");
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Verification step state
  const [step, setStep] = useState('data'); // 'data' | 'verify'
  const [userId, setUserId] = useState(null);

  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        return value.length < 2 ? "First name must be at least 2 characters" : "";
      case "lastName":
        return value.length < 2 ? "Last name must be at least 2 characters" : "";
      case "username":
        if (value.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Letters, numbers, _ and - only";
        return "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email address" : "";
      case "password":
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "confirmPassword":
        return value !== formData.password ? "Passwords don't match" : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) {
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRATION SUBMIT
  // ⚠️ PRESERVING EXISTING API CALL LOGIC - DO NOT MODIFY
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubmitData = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above");
      return;
    }

    setSubmitting(true);
    try {
      // ⚠️ EXISTING API CALL - PRESERVED
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      console.log("🔍 BACKEND RESPONSE:", data);

      setUserId(data.userId);
      setStep("verify");
      setSubmitting(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(String(msg));
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ⚠️ PRESERVING EXISTING API CALL LOGIC - DO NOT MODIFY
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVerification = async (code) => {
    setSubmitting(true);
    setError("");

    try {
      // ⚠️ EXISTING API CALL - PRESERVED
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Verification failed");
      }

      const data = await response.json();

      localStorage.setItem("ss.jwt", data.token);
      localStorage.setItem("ss.user", JSON.stringify(data.user));

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={step === "data" ? "Create your account" : "Verify your email"}
      subtitle={step === "data" ? OPENSHARE_MESSAGING.plainEnglish : undefined}
    >

      <AnimatePresence mode="wait">
        {step === "data" ? (
          <motion.form
            key="data-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmitData}
            className="space-y-4"
          >
            <AuthError>{error}</AuthError>

            {/* ══════════════════════════════════════════════════════════════
                GOOGLE SIGN-UP — Solid white button, visible on any background
            ══════════════════════════════════════════════════════════════ */}
             <button
          type="button"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/auth/google`;
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
          Continue with Google
        </button>

            {/* ── "or" divider ── */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/70" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-medium">or</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* First name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-2xl
                      bg-white ring-1 text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                      ${fieldErrors.firstName ? 'ring-red-500/30' : 'ring-slate-200'}
                    `}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last name (ALIGNMENT FIX: icon + pl-10 to match) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Last name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-2xl
                      bg-white ring-1 text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                      ${fieldErrors.lastName ? 'ring-red-500/30' : 'ring-slate-200'}
                    `}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-2xl
                    bg-white ring-1 text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                    ${fieldErrors.username ? 'ring-red-500/30' : 'ring-slate-200'}
                  `}
                />
              </div>
              {fieldErrors.username ? (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.username}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Letters, numbers, underscores, and hyphens only
                </p>
              )}
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
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-2xl
                    bg-white ring-1 text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                    ${fieldErrors.email ? 'ring-red-500/30' : 'ring-slate-200'}
                  `}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    w-full pl-10 pr-10 py-3 rounded-2xl
                    bg-white ring-1 text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                    ${fieldErrors.password ? 'ring-red-500/30' : 'ring-slate-200'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.password}
                </p>
              ) : formData.password ? (
                <div className="mt-2">
                  <PasswordStrengthMeter password={formData.password} />
                </div>
              ) : null}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    w-full pl-10 pr-10 py-3 rounded-2xl
                    bg-white ring-1 text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all duration-200
                    ${fieldErrors.confirmPassword
                      ? 'ring-red-500/30'
                      : formData.confirmPassword && formData.confirmPassword === formData.password
                        ? 'ring-green-500/30'
                        : 'ring-slate-200'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.confirmPassword ? (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.confirmPassword}
                </p>
              ) : formData.confirmPassword && formData.confirmPassword === formData.password ? (
                <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Passwords match
                </p>
              ) : null}
            </div>

            <AuthButton type="submit" loading={submitting} className="btn-primary">
              Create Account
              <ArrowRight className="w-5 h-5" />
            </AuthButton>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-[#7c3aed] hover:text-[#6d28d9]">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-slate-500">
              By creating an account, you agree to OpenShare&apos;s{" "}
              <a href="#" className="text-[#7c3aed] hover:underline">Terms</a>{" "}
              and{" "}
              <a href="#" className="text-[#7c3aed] hover:underline">Privacy Policy</a>
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="verify-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <VerificationStep
              email={formData.email}
              userId={userId}
              onVerify={handleVerification}
              onBack={() => setStep("data")}
              error={error}
              submitting={submitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

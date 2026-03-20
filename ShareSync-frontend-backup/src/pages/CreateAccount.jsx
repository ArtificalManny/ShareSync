// src/pages/CreateAccount.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Create Account Page
// Frontend-only polish: Pristine Light Mode & High Contrast CTA
// NO backend endpoints or auth logic modified
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, X,
  AtSign, ArrowLeft
} from "lucide-react";
import { AuthLayout, AuthButton, AuthError } from "../layouts/AuthLayout";

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
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? colors[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">Password strength</span>
        <span className={`text-xs font-bold ${score >= 4 ? 'text-emerald-500' : score >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
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
            w-12 h-14 text-center text-2xl font-bold
            bg-white border-2 border-slate-200 rounded-xl
            text-slate-900 shadow-sm
            focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 hover:border-slate-300
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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-50 border border-violet-100 shadow-sm flex items-center justify-center">
          <Mail className="w-8 h-8 text-violet-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          We sent a 6-digit code to<br />
          <span className="text-slate-900 font-bold">{email}</span>
        </p>
      </div>

      <AuthError>{error}</AuthError>

      <OTPInput value={code} onChange={setCode} />

      <AuthButton 
        type="submit" 
        loading={submitting} 
        disabled={code.length !== 6}
        className="!bg-violet-600 hover:!bg-violet-700 !text-white !border-none !shadow-lg !shadow-violet-600/30 transition-all duration-200"
      >
        <Check className="w-5 h-5" />
        Verify Email
      </AuthButton>

      <p className="text-center text-sm font-medium text-slate-500">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0}
          className={`${resendCountdown > 0 ? 'text-slate-400' : 'text-violet-600 font-bold hover:text-violet-700 transition-colors'}`}
        >
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend'}
        </button>
      </p>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Use a different email
      </button>
    </form>
  );
}

export default function CreateAccount() {
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
      const response = await fetch("http://localhost:3000/api/auth/register", {
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
      const response = await fetch("http://localhost:3000/api/auth/verify-email", {
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

  // Shared light mode input classes
  const baseInputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl font-medium border-2 transition-all duration-200 focus:outline-none focus:ring-4 shadow-sm ";
  const normalClass = baseInputClass + "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:ring-violet-500/10";
  const errorClass = baseInputClass + "bg-red-50 border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20";
  const successClass = baseInputClass + "bg-white border-emerald-400 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20";
  const getInputClass = (err, success = false) => err ? errorClass : success ? successClass : normalClass;

  return (
    <AuthLayout
      title={step === "data" ? "Create your account" : "Verify your email"}
      subtitle={step === "data" ? "Start shipping with momentum" : undefined}
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

            <div className="grid grid-cols-2 gap-3">
              {/* First name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass(fieldErrors.firstName)}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Last name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass(fieldErrors.lastName)}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass(fieldErrors.username)}
                />
              </div>
              {fieldErrors.username ? (
                <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${getInputClass(fieldErrors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.password ? (
                <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.password}
                </p>
              ) : formData.password ? (
                <PasswordStrengthMeter password={formData.password} />
              ) : null}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${getInputClass(fieldErrors.confirmPassword, formData.confirmPassword && formData.confirmPassword === formData.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.confirmPassword ? (
                <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.confirmPassword}
                </p>
              ) : formData.confirmPassword && formData.confirmPassword === formData.password ? (
                <p className="mt-1 text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Passwords match
                </p>
              ) : null}
            </div>

            {/* Submit CTA - High Contrast Purple */}
            <AuthButton 
              type="submit" 
              loading={submitting}
              className="!bg-violet-600 hover:!bg-violet-700 !text-white !border-none !shadow-lg !shadow-violet-600/30 transition-all duration-200"
            >
              Create Account
              <ArrowRight className="w-5 h-5" />
            </AuthButton>

            <p className="text-center text-sm font-medium text-slate-500 pt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-600 font-bold hover:text-violet-700 transition-colors">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-slate-500">
              By creating an account, you agree to OpenShare&apos;s{" "}
              <a href="#" className="text-violet-600 font-medium hover:underline">Terms</a>{" "}
              and{" "}
              <a href="#" className="text-violet-600 font-medium hover:underline">Privacy Policy</a>
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

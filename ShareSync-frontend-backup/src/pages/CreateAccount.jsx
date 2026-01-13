// src/pages/CreateAccount.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, X, 
  AlertCircle, AtSign, UserCircle, Sparkles 
} from "lucide-react";
import client from "../api/client";

export default function CreateAccount() {
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
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "text-red-500" };
    if (strength <= 3) return { strength, label: "Fair", color: "text-yellow-500" };
    if (strength <= 4) return { strength, label: "Good", color: "text-blue-500" };
    return { strength, label: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Real-time validation
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        return value.length < 2 ? "First name must be at least 2 characters" : "";
      case "lastName":
        return value.length < 2 ? "Last name must be at least 2 characters" : "";
      case "username":
        if (value.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Username can only contain letters, numbers, _ and -";
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
    
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above");
      return;
    }

    setSubmitting(true);
    try {
      // Create account
      await client.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Auto-login after successful registration
      await login({ 
        email: formData.email, 
        password: formData.password 
      });

      navigate("/home", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-8 min-h-screen grid place-items-center">
      <div className="w-full max-w-2xl">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              OpenShare
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Start shipping outcomes that matter
          </p>
        </div>

        {/* Registration Form Card */}
        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
            Create your account
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400 text-sm px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  className={`w-full rounded-lg border ${
                    fieldErrors.firstName
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                  } bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  className={`w-full rounded-lg border ${
                    fieldErrors.lastName
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                  } bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username
              <span className="ml-2 text-xs text-slate-500">(used for your public profile)</span>
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                className={`w-full rounded-lg border ${
                  fieldErrors.username
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                } bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            {fieldErrors.username ? (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className={`w-full rounded-lg border ${
                  fieldErrors.email
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                } bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className={`w-full rounded-lg border ${
                  fieldErrors.password
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                } bg-white dark:bg-slate-800 pl-10 pr-12 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {fieldErrors.password}
              </p>
            ) : formData.password ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Password strength:</span>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.strength <= 2
                        ? "bg-red-500"
                        : passwordStrength.strength <= 3
                        ? "bg-yellow-500"
                        : passwordStrength.strength <= 4
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                className={`w-full rounded-lg border ${
                  fieldErrors.confirmPassword
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-purple-500"
                } bg-white dark:bg-slate-800 pl-10 pr-12 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {fieldErrors.confirmPassword}
              </p>
            ) : formData.confirmPassword && formData.confirmPassword === formData.password ? (
              <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Passwords match
              </p>
            ) : null}
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
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          By creating an account, you agree to OpenShare's{" "}
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
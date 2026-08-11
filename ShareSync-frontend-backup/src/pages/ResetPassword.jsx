// src/pages/ResetPassword.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Reset Password Page
// Token validation + new password entry
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { AuthLayout, AuthButton, AuthError } from '../layouts/AuthLayout';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, user, loading, authError, setAuthError } = useAuth();
  
  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pageState, setPageState] = useState('form'); // 'form' | 'success'
  const [tokenState, setTokenState] = useState('checking'); // 'checking' | 'valid' | 'invalid'
  const [maskedEmail, setMaskedEmail] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [loading, user, navigate]);

  // Validate the reset token before accepting a new password.
  // The backend returns only a masked email address for privacy.
  useEffect(() => {
    if (loading || user) return;

    let active = true;

    const validateToken = async () => {
      if (!token) {
        if (active) setTokenState('invalid');
        return;
      }

      try {
        const response = await api.get(
          `/auth/validate-reset-token/${encodeURIComponent(token)}`
        );
        const payload = response.data?.data ?? response.data;

        if (!active) return;

        if (payload?.valid) {
          setMaskedEmail(String(payload.email || ''));
          setTokenState('valid');
        } else {
          setTokenState('invalid');
        }
      } catch {
        if (active) {
          setTokenState('invalid');
        }
      }
    };

    void validateToken();

    return () => {
      active = false;
    };
  }, [loading, user, token]);

  // Check if passwords match
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ⚠️ PRESERVING EXISTING useAuth().resetPassword() CALL - DO NOT MODIFY
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthError && setAuthError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // ⚠️ EXISTING AUTH CALL - PRESERVED
      const success = await resetPassword(token, newPassword);
      
      if (success) {
        setPageState('success');
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || tokenState === 'checking') {
    return (
      <AuthLayout title="Loading..." subtitle="Please wait">
        <div className="flex justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      </AuthLayout>
    );
  }

  // Invalid / expired reset link
  if (tokenState === 'invalid') {
    return (
      <AuthLayout
        title="Reset link expired"
        subtitle="Request a new password reset link to continue"
      >
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
            <p className="text-sm text-slate-700">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <Link
            to="/forgot-password"
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
          >
            Request a new reset link
          </Link>

          <Link
            to="/login"
            className="inline-block text-sm text-violet-700 hover:text-violet-800"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <AuthLayout
        title="Password updated!"
        subtitle="Redirecting you to sign in..."
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-green-400" />
          </motion.div>

          <p className="text-sm text-slate-400">
            Your password has been successfully updated.
          </p>

          {/* Progress bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 'Available' }}
            transition={{ duration: 2, ease: 'linear' }}
            className="h-1 bg-green-500 rounded-full mx-auto max-w-xs"
          />
        </div>
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Make it strong and unique"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError>{error || authError}</AuthError>

        {maskedEmail ? (
          <div
            className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-center"
            data-openshare-reset-identity="masked-email-v1"
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Resetting password for
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {maskedEmail}
            </p>
          </div>
        ) : null}

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`
                w-full pl-10 pr-10 py-2.5 rounded-lg
                bg-white/[0.04] border text-white placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-purple-500/20
                transition-all duration-200
                ${confirmPassword 
                  ? passwordsMatch 
                    ? 'border-green-500/50' 
                    : 'border-red-500/50'
                  : 'border-white/[0.08] focus:border-purple-500/50'
                }
              `}
            />
            {confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
          )}
        </div>

        {/* Submit */}
        <AuthButton
          type="submit"
          loading={submitting}
          disabled={!passwordsMatch}
          className="min-h-[50px]"
          style={{
            backgroundColor: '#7c3aed',
            backgroundImage:
              'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 55%, #6d28d9 100%)',
            color: '#ffffff',
            border: '1px solid rgba(124,58,237,0.40)',
            boxShadow:
              '0 14px 34px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}
          data-openshare-reset-submit="visible-v1"
        >
          Update Password
        </AuthButton>

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

// src/pages/ForgotPassword.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Forgot Password Page
// Shows success state after sending (for security, always says "if exists")
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, AuthButton, AuthError } from '../layouts/AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, user, loading } = useAuth();
  
  // State
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pageState, setPageState] = useState('form'); // 'form' | 'sent'

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ⚠️ PRESERVING EXISTING useAuth().forgotPassword() CALL - DO NOT MODIFY
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setSubmitting(true);
    try {
      // ⚠️ EXISTING AUTH CALL - PRESERVED
      await forgotPassword(email);
      setPageState('sent');
    } catch (err) {
      // Still show success for security - don't reveal if email exists
      setPageState('sent');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AuthLayout title="Loading..." subtitle="Please wait">
        <div className="flex justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full"
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={pageState === 'form' ? 'Reset your password' : 'Check your email'}
      subtitle={pageState === 'form' 
        ? "We'll send you a link to reset it" 
        : 'If an account exists, we sent a reset link'
      }
    >
      <AnimatePresence mode="wait">
        {pageState === 'form' ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AuthError>{error}</AuthError>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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

            {/* Submit CTA - High Contrast Purple */}
            <AuthButton 
              type="submit" 
              loading={submitting}
              className="!bg-violet-600 hover:!bg-violet-700 !text-white !border-none !shadow-lg !shadow-violet-600/30 transition-all duration-200"
            >
              Send Reset Link
            </AuthButton>

            {/* Back to login */}
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </motion.form>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-6"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm"
            >
              <Check className="w-8 h-8 text-emerald-500" />
            </motion.div>

            <p className="text-sm text-slate-600 font-medium">
              Check your inbox for a password reset link.
              <br />
              The link expires in 15 minutes.
            </p>

            <div className="space-y-3 pt-2">
              <AuthButton variant="secondary" onClick={() => setPageState('form')}>
                Try a different email
              </AuthButton>

              <Link
                to="/login"
                className="block text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors pt-2"
              >
                Back to sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

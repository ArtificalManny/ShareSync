// src/pages/ForgotPassword.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLASS FORTRESS - Forgot Password Page
// Added OpenShare Kinetic Monogram Logo
// Shows success state after sending (for security, always says "if exists")
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, AuthButton, AuthError } from '../layouts/AuthLayout';
import Logo from "../components/ui/Logo";

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
      // Note: For security, we ALWAYS show success (don't reveal if email exists)
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
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
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
            className="space-y-4"
          >
            {/* OpenShare Kinetic Monogram */}
            <div className="flex justify-center mb-6 drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]">
              <Logo size={48} />
            </div>

            <AuthError>{error}</AuthError>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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

            {/* Submit */}
            <AuthButton type="submit" loading={submitting}>
              Send Reset Link
            </AuthButton>

            {/* Back to login */}
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
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
            {/* OpenShare Kinetic Monogram */}
            <div className="flex justify-center mb-2 drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]">
              <Logo size={48} />
            </div>

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-green-400" />
            </motion.div>

            <p className="text-sm text-slate-400">
              Check your inbox for a password reset link.
              <br />
              The link expires in 15 minutes.
            </p>

            <div className="space-y-3">
              <AuthButton variant="secondary" onClick={() => setPageState('form')}>
                Try a different email
              </AuthButton>

              <Link
                to="/login"
                className="block text-sm text-purple-400 hover:text-purple-300"
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

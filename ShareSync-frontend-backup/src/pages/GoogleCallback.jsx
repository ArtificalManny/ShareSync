// src/pages/GoogleCallback.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH CALLBACK PAGE
// After Google sign-in, the backend redirects here with ?token=xxx&user=...
// This page extracts the token, stores it in AuthContext, and redirects home.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function GoogleCallback() {
  useDocumentTitle("OpenShare");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('No authentication token received');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      // Store token
      localStorage.setItem('token', token);
      if (setToken) setToken(token);

      // Parse and store user if provided
      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('user', JSON.stringify(user));
          if (setUser) setUser(user);
        } catch (e) {
          console.warn('[GoogleCallback] Could not parse user param:', e);
        }
      }

      console.log('🟢 Google OAuth callback: Token stored, redirecting...');
      navigate('/', { replace: true });
    } catch (e) {
      console.error('[GoogleCallback] Error processing callback:', e);
      setError('Authentication failed');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, setToken, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <p className="text-sm text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        <span className="font-medium">Completing sign in...</span>
      </div>
    </div>
  );
}

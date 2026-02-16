// src/context/AuthContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT — Complete authentication state management
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Derived state
  const isAuthenticated = !!user;
  const isLoading = loading;

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('ss.jwt');

      if (!token) {
        console.log('[AuthContext] No token found');
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Token found, verifying...');
        const response = await api.post('/auth/verify', { token });
        console.log('[AuthContext] Verify response:', response.data);

        // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
        const payload = response.data?.data ?? response.data;

        if (payload && payload.user) {
          console.log('[AuthContext] Token valid, user:', payload.user.email);
          setUser(payload.user);
          localStorage.setItem('ss.user', JSON.stringify(payload.user));
        } else {
          console.log('[AuthContext] Token invalid');
          localStorage.removeItem('ss.jwt');
          localStorage.removeItem('ss.user');
        }
      } catch (error) {
        console.error('[AuthContext] Token verification failed:', error);
        localStorage.removeItem('ss.jwt');
        localStorage.removeItem('ss.user');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  const login = async ({ email, password }) => {
    try {
      setAuthError(null);
      console.log('[AuthContext] 🔵 Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('[AuthContext] 🔵 Login response:', response.data);

      // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
      const payload = response.data?.data ?? response.data;

      // Handle unverified user case
      if (payload?.needsVerification) {
        return {
          success: false,
          needsVerification: true,
          userId: payload.userId,
          error: payload.message || 'Please verify your email',
        };
      }

      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('ss.jwt', token);
      localStorage.setItem('ss.user', JSON.stringify(userData));
      setUser(userData);

      console.log('[AuthContext] 🎉 Login successful!');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] ❌ Login error:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Login failed';
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════════════
  const register = async ({ email, username, firstName, lastName, password }) => {
    try {
      setAuthError(null);
      console.log('[AuthContext] 🔵 Attempting registration for:', email);
      const response = await api.post('/auth/register', {
        email,
        username,
        firstName,
        lastName,
        password,
      });

      console.log('[AuthContext] 🔵 Registration response:', response.data);

      // ✅ Unwrap TransformInterceptor format: { success, data, timestamp }
      const payload = response.data?.data ?? response.data;

      // New flow returns { userId } for verification
      if (payload?.userId) {
        console.log('[AuthContext] 🎉 Registration successful, needs verification');
        return { 
          success: true, 
          userId: payload.userId,
          message: payload.message || 'Verification code sent',
        };
      }

      // Legacy flow returns { access_token, user }
      const token = payload?.access_token || payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        localStorage.setItem('ss.jwt', token);
        localStorage.setItem('ss.user', JSON.stringify(userData));
        setUser(userData);
        console.log('[AuthContext] 🎉 Registration successful (legacy flow)!');
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('[AuthContext] ❌ Registration error:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed';
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY EMAIL
  // ═══════════════════════════════════════════════════════════════════════════
  const verifyEmail = async (userId, code) => {
    try {
      setAuthError(null);
      console.log('[AuthContext] 🔵 Verifying email for userId:', userId);
      const response = await api.post('/auth/verify-email', { userId, code });
      console.log('[AuthContext] 🔵 Verify response:', response.data);

      const payload = response.data?.data ?? response.data;

      const token = payload?.token;
      const userData = payload?.user;

      if (token && userData) {
        localStorage.setItem('ss.jwt', token);
        localStorage.setItem('ss.user', JSON.stringify(userData));
        setUser(userData);
        console.log('[AuthContext] 🎉 Email verified!');
        return { success: true };
      }

      return { success: false, error: 'Verification failed' };
    } catch (error) {
      console.error('[AuthContext] ❌ Verification error:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Verification failed';
      setAuthError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  const forgotPassword = async (email) => {
    try {
      setAuthError(null);
      console.log('[AuthContext] 🔵 Requesting password reset for:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log('[AuthContext] 🔵 Forgot password response:', response.data);

      // Always returns success for security
      return true;
    } catch (error) {
      console.error('[AuthContext] ❌ Forgot password error:', error);
      // Still return true for security (don't reveal if email exists)
      return true;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  const resetPassword = async (token, newPassword) => {
    try {
      setAuthError(null);
      console.log('[AuthContext] 🔵 Resetting password');
      const response = await api.post('/auth/reset-password', { token, newPassword });
      console.log('[AuthContext] 🔵 Reset password response:', response.data);

      const payload = response.data?.data ?? response.data;

      if (payload?.success) {
        console.log('[AuthContext] 🎉 Password reset successful!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] ❌ Reset password error:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Password reset failed';
      setAuthError(errorMsg);
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════
  const logout = () => {
    console.log('[AuthContext] 🔴 Logging out...');
    localStorage.removeItem('ss.jwt');
    localStorage.removeItem('ss.user');
    setUser(null);
    setAuthError(null);
    window.location.href = '/login';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════
  const value = {
    // State
    user,
    loading,
    isLoading, // Alias for loading
    isAuthenticated,
    authError,
    setAuthError,
    
    // Methods
    login,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export both named and default for compatibility
export { AuthContext };
export default AuthContext;

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ CHECK TOKEN ON APP STARTUP
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
        
        if (response.data && response.data.user) {
          console.log('[AuthContext] Token valid, user:', response.data.user.email);
          setUser(response.data.user);
          localStorage.setItem('ss.user', JSON.stringify(response.data.user));
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

  // ✅ FIXED: Accept object parameter
  const login = async ({ email, password }) => {
    try {
      console.log('[AuthContext] 🔵 Attempting login for:', { email, password });
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('[AuthContext] 🔵 Full login response:', response.data);
      
      // ✅ CRITICAL FIX: Backend returns either "token" or "access_token"
      // Try both to be safe
      const token = response.data.access_token || response.data.token;
      const userData = response.data.user;
      
      console.log('[AuthContext] 🔵 Extracted token:', token ? 'YES ✅' : 'NO ❌');
      console.log('[AuthContext] 🔵 Extracted user:', userData ? 'YES ✅' : 'NO ❌');
      
      if (!token) {
        console.error('[AuthContext] ❌ NO TOKEN IN RESPONSE!', response.data);
        throw new Error('No token received from server');
      }
      
      if (!userData) {
        console.error('[AuthContext] ❌ NO USER DATA IN RESPONSE!', response.data);
        throw new Error('No user data received from server');
      }
      
      console.log('[AuthContext] 🟢 Saving to localStorage...');
      console.log('[AuthContext] 🟢 Token length:', token.length);
      console.log('[AuthContext] 🟢 User email:', userData.email);
      
      // ✅ Save to localStorage
      localStorage.setItem('ss.jwt', token);
      localStorage.setItem('ss.user', JSON.stringify(userData));
      
      // ✅ Verify it was saved
      const savedToken = localStorage.getItem('ss.jwt');
      console.log('[AuthContext] �� Verified saved token:', savedToken ? 'YES ✅' : 'NO ❌');
      
      // ✅ Update state
      setUser(userData);
      
      console.log('[AuthContext] 🎉 Login successful!');
      
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] ❌ Login error:', error);
      console.error('[AuthContext] ❌ Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    console.log('[AuthContext] 🔴 Logging out...');
    localStorage.removeItem('ss.jwt');
    localStorage.removeItem('ss.user');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;

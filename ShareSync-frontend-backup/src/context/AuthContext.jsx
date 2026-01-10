import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async ({ email, password }) => {
    try {
      console.log('[AuthContext] 🔵 Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('[AuthContext] 🔵 Login response:', response.data);
      
      const token = response.data.access_token || response.data.token;
      const userData = response.data.user;
      
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
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async ({ email, username, firstName, lastName, password }) => {
    try {
      console.log('[AuthContext] 🔵 Attempting registration for:', email);
      const response = await api.post('/auth/register', {
        email,
        username,
        firstName,
        lastName,
        password
      });
      
      console.log('[AuthContext] 🔵 Registration response:', response.data);
      
      const token = response.data.access_token || response.data.token;
      const userData = response.data.user;
      
      if (token && userData) {
        localStorage.setItem('ss.jwt', token);
        localStorage.setItem('ss.user', JSON.stringify(userData));
        setUser(userData);
        console.log('[AuthContext] 🎉 Registration successful!');
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('[AuthContext] ❌ Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('[AuthContext] 🔴 Logging out...');
    localStorage.removeItem('ss.jwt');
    localStorage.removeItem('ss.user');
    setUser(null);
    // Use window.location for full page reload to /login
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    register,
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

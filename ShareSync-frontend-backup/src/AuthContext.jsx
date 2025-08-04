// src/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import client from './api/client'; // axios instance
import { getAccessToken, setTokens, clearTokens } from './utils/tokenUtils';

const AuthContext = createContext();
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Login: calls backend, stores tokens, fetches user
  const login = async (email, password) => {
    try {
      const { data } = await client.post('/auth/login', { email, password });

      // Save tokens
      setTokens(data.access_token, data.refresh_token);

      // Fetch updated user with streaks, etc.
      const userRes = await client.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = userRes.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (err) {
      console.error('AuthContext - login failed:', err);
      logout();
      throw err;
    }
  };

  // Logout
  const logout = () => {
    clearTokens();
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Update user profile in state and storage
  const updateProfile = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client'; // axios instance

const STORAGE_KEY = 'user';

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // Persist to localStorage whenever user changes
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  // Call backend login and update tokens + lastLogin
  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    // Immediately fetch updated user with lastLogin & streakDays
    const userRes = await client.get('/api/users/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    setUser(userRes.data); // Use full backend-fetched user object
    return userRes.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((u) => ({ ...u, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

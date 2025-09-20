import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client'; // axios instance

const STORAGE_KEY = 'user';

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
  }, []);

  // Persist to localStorage whenever user changes
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  // Listen for global "user:updated" events (e.g., from sockets or Profile page)
  useEffect(() => {
    const handler = (e) => {
      const patch = e?.detail || {};
      setUser((u) => (u ? { ...u, ...patch } : u));
    };
    window.addEventListener('user:updated', handler);
    return () => window.removeEventListener('user:updated', handler);
  }, []);

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

  /** Fetch latest user from server and store */
  const refreshUser = async () => {
    const res = await client.get('/api/users/me');
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        refreshUser,
        setUser, // exposed in case callers want to replace user atomically
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

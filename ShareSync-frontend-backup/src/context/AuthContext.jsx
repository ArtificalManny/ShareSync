import React, { createContext, useState, useEffect } from 'react';
import { getAccessToken, clearTokens } from './utils/tokenUtils'; // Adjust path

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const token = getAccessToken();
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAuthenticated(!!token);
    setUser(storedUser);
  }, []);

  const login = (accessToken, refreshToken, userData) => {
    setTokens(accessToken, refreshToken, userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser({});
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
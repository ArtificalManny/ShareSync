import React, { createContext, useState, useEffect } from 'react';
import { login, logout, register, forgotPassword, resetPassword } from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const data = await login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const registerUser = async (userData) => {
    try {
      await register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const forgotPasswordUser = async (email) => {
    try {
      const response = await forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resetPasswordUser = async (token, newPassword) => {
    try {
      const response = await resetPassword(token, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        loginUser,
        logoutUser,
        registerUser,
        forgotPasswordUser,
        resetPasswordUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
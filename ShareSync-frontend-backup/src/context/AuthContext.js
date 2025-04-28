import React, { createContext, useState, useEffect } from 'react';
import { login, logout, register, forgotPassword, resetPassword } from '../services/auth.service';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      console.log('AuthContext - Initializing: token=', token, 'userData=', userData);
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log('AuthContext - User authenticated:', JSON.parse(userData));
        toast.success(`Welcome back, ${JSON.parse(userData).firstName}!`, { position: 'top-right', autoClose: 3000 });
      } else {
        console.log('AuthContext - No token or user data found');
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const data = await login(email, password);
      console.log('AuthContext - Login successful:', data);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success(`Logged in as ${data.user.firstName}!`, { position: 'top-right', autoClose: 3000 });
      return { success: true };
    } catch (error) {
      console.error('AuthContext - Login failed:', error.message);
      toast.error(error.message || 'Failed to login', { position: 'top-right', autoClose: 3000 });
      return { success: false, message: error.message || 'Failed to login' };
    }
  };

  const logoutUser = async () => {
    console.log('AuthContext - Logging out');
    await logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const registerUser = async (userData) => {
    try {
      await register(userData);
      console.log('AuthContext - Registration successful');
      toast.success('Registration successful! Please log in.', { position: 'top-right', autoClose: 3000 });
      return { success: true };
    } catch (error) {
      console.error('AuthContext - Registration failed:', error.message);
      toast.error(error.message || 'Failed to register', { position: 'top-right', autoClose: 3000 });
      return { success: false, message: error.message || 'Failed to register' };
    }
  };

  const forgotPasswordUser = async (email) => {
    try {
      const response = await forgotPassword(email);
      console.log('AuthContext - Forgot password successful:', response);
      toast.success(response.message || 'Reset link sent to your email', { position: 'top-right', autoClose: 3000 });
      return { success: true, message: response.message || 'Reset link sent to your email' };
    } catch (error) {
      console.error('AuthContext - Forgot password failed:', error.message);
      toast.error(error.message || 'Failed to send reset link', { position: 'top-right', autoClose: 3000 });
      return { success: false, message: error.message || 'Failed to send reset link' };
    }
  };

  const resetPasswordUser = async (token, newPassword) => {
    try {
      const response = await resetPassword(token, newPassword);
      console.log('AuthContext - Reset password successful:', response);
      toast.success(response.message || 'Password reset successful', { position: 'top-right', autoClose: 3000 });
      return { success: true, message: response.message || 'Password reset successful' };
    } catch (error) {
      console.error('AuthContext - Reset password failed:', error.message);
      toast.error(error.message || 'Failed to reset password', { position: 'top-right', autoClose: 3000 });
      return { success: false, message: error.message || 'Failed to reset password' };
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
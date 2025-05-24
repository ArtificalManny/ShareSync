import React, { createContext, useState, useEffect } from 'react';
import { getAccessToken, setTokens, clearTokens } from './utils/tokenUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider - Initializing');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = getAccessToken();
      console.log('AuthProvider - Initial token:', token);
      return !!token;
    } catch (error) {
      console.error('AuthProvider - Error checking token:', error.message);
      return false;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser
        ? JSON.parse(storedUser)
        : {
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            job: 'Software Engineer',
            school: 'Stanford University',
            profilePicture: 'https://via.placeholder.com/150',
            bannerPicture: 'https://via.placeholder.com/1200x300',
            projects: [
              { id: '1', title: 'Project Alpha', category: 'Job', status: 'In Progress' },
              { id: '2', title: 'Project Beta', category: 'School', status: 'Completed' },
            ],
          };
      console.log('AuthProvider - Initial user:', parsedUser);
      return parsedUser;
    } catch (error) {
      console.error('AuthProvider - Error parsing user:', error.message);
      return {};
    }
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: { taskCompletion: true, newPost: true, fileUpload: true },
    sms: { taskCompletion: true, newPost: false, fileUpload: false },
  });

  useEffect(() => {
    console.log('AuthProvider - Syncing auth state');
    try {
      const token = getAccessToken();
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        job: 'Software Engineer',
        school: 'Stanford University',
        profilePicture: 'https://via.placeholder.com/150',
        bannerPicture: 'https://via.placeholder.com/1200x300',
        projects: [
          { id: '1', title: 'Project Alpha', category: 'Job', status: 'In Progress' },
          { id: '2', title: 'Project Beta', category: 'School', status: 'Completed' },
        ],
      };
      setIsAuthenticated(!!token);
      setUser(parsedUser);
      console.log('AuthProvider - Synced state:', { isAuthenticated: !!token, user: parsedUser });
    } catch (error) {
      console.error('AuthProvider - Error in useEffect:', error.message);
      setIsAuthenticated(false);
      setUser({});
    }
  }, []);

  const login = (accessToken, refreshToken, userData) => {
    console.log('AuthProvider - Logging in:', { accessToken, refreshToken, userData });
    try {
      if (!accessToken) throw new Error('Access token is required');
      setTokens(accessToken, refreshToken, userData);
      setIsAuthenticated(true);
      setUser(userData || {});
      console.log('AuthProvider - Login successful');
    } catch (error) {
      console.error('AuthProvider - Login error:', error.message);
      setIsAuthenticated(false);
      setUser({});
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthProvider - Logging out');
    try {
      clearTokens();
      setIsAuthenticated(false);
      setUser({});
      console.log('AuthProvider - Logout successful');
    } catch (error) {
      console.error('AuthProvider - Logout error:', error.message);
    }
  };

  const updateUserProfile = (updatedDetails) => {
    const updatedUser = { ...user, ...updatedDetails };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const updateNotificationPrefs = (prefs) => {
    setNotificationPrefs(prefs);
    // In a real app, save to backend or localStorage
  };

  const value = { isAuthenticated, user, login, logout, setUser, updateUserProfile, notificationPrefs, updateNotificationPrefs };
  console.log('AuthProvider - Context value:', value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
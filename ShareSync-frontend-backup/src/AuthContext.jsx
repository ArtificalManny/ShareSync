import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [intendedRoute, setIntendedRoute] = useState(null);

  const socket = io('http://localhost:3000');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext - Checking authentication status');
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('AuthContext - Fetching user data from /api/auth/me');
          const response = await axios.get('http://localhost:3000/api/auth/me', {
            timeout: 10000, // Increase timeout to 10 seconds
          });
          console.log('AuthContext - User data fetched:', response.data);
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('AuthContext - Failed to authenticate:', err.message);
          setAuthError('Authentication failed. Please log in again.');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          setUser(null); // Ensure user is null on failure
        }
      } else {
        console.log('AuthContext - No token found, user not authenticated');
      }
      setIsLoading(false);
      console.log('AuthContext - isLoading set to false, isAuthenticated:', isAuthenticated, 'user:', user);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Persist theme in localStorage
    localStorage.setItem('theme', theme);
    console.log('AuthContext - Theme updated:', theme);
  }, [theme]);

  const login = async (email, password) => {
    try {
      console.log('AuthContext - Attempting login with email:', email);
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password }, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      console.log('AuthContext - Login successful, user:', response.data.user);
      return true;
    } catch (err) {
      console.error('AuthContext - Login failed:', err.message);
      setAuthError('Login failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext - Attempting registration with data:', userData);
      const response = await axios.post('http://localhost:3000/api/auth/register', userData, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      console.log('AuthContext - Registration successful, user:', response.data.user);
      return true;
    } catch (err) {
      console.error('AuthContext - Registration failed:', err.message);
      setAuthError('Registration failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext - Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const updateUserProfile = async (updates) => {
    try {
      console.log('AuthContext - Updating user profile with:', updates);
      const response = await axios.put('http://localhost:3000/api/auth/me', updates, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      setUser(response.data);
      console.log('AuthContext - Profile updated:', response.data);
      return response.data;
    } catch (err) {
      console.error('AuthContext - Update profile failed:', err.message);
      throw new Error('Update profile failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const addProject = async (projectData) => {
    try {
      console.log('AuthContext - Adding project with data:', projectData);
      const response = await axios.post('http://localhost:3000/api/projects', projectData, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      const newProject = response.data;
      if (!newProject || !newProject.id) {
        throw new Error('Project creation failed: Invalid project data returned.');
      }
      try {
        const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
          timeout: 10000, // Increase timeout to 10 seconds
        });
        setUser(updatedUser.data);
        console.log('AuthContext - User data updated after project creation:', updatedUser.data);
      } catch (err) {
        console.warn('AuthContext - Failed to fetch updated user data after project creation:', err.message);
        setUser(prevUser => ({
          ...prevUser,
          projects: [...(prevUser.projects || []), newProject],
        }));
      }
      return newProject;
    } catch (err) {
      console.error('AuthContext - Add project failed:', err.message);
      throw new Error('Add project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      console.log('AuthContext - Updating project ID:', projectId, 'with:', updates);
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      const updatedProject = response.data;
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      setUser(updatedUser.data);
      console.log('AuthContext - Project updated:', updatedProject);
      return updatedProject;
    } catch (err) {
      console.error('AuthContext - Update project failed:', err.message);
      throw new Error('Update project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const inviteToProject = async (projectId, email) => {
    try {
      console.log('AuthContext - Inviting', email, 'to project ID:', projectId);
      await axios.post(`http://localhost:3000/api/projects/${projectId}/invite`, { email }, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      socket.emit('notification', {
        projectId,
        message: `${user.email} invited ${email} to the project`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('AuthContext - Invite to project failed:', err.message);
      throw new Error('Invite to project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const autoAssignTasks = async (projectId) => {
    try {
      console.log('AuthContext - Auto-assigning tasks for project ID:', projectId);
      await axios.post(`http://localhost:3000/api/projects/${projectId}/auto-assign-tasks`, {}, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      socket.emit('notification', {
        projectId,
        message: `${user.email} auto-assigned tasks`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('AuthContext - Auto-assign tasks failed:', err.message);
      throw new Error('Auto-assign tasks failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateUserProfile,
    addProject,
    updateProject,
    inviteToProject,
    autoAssignTasks,
    theme,
    toggleTheme,
    intendedRoute,
    setIntendedRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
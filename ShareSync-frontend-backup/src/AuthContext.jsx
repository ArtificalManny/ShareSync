import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [intendedRoute, setIntendedRoute] = useState(null);

  const socket = io('http://localhost:3000');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('http://localhost:3000/api/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('AuthContext - Failed to authenticate:', err.message);
          setAuthError('Authentication failed. Please log in again.');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (err) {
      console.error('AuthContext - Login failed:', err.message);
      setAuthError('Login failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (err) {
      console.error('AuthContext - Registration failed:', err.message);
      setAuthError('Registration failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const updateUserProfile = async (updates) => {
    try {
      const response = await axios.put('http://localhost:3000/api/auth/me', updates);
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('AuthContext - Update profile failed:', err.message);
      throw err;
    }
  };

  const addProject = async (projectData) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await axios.post('http://localhost:3000/api/projects', projectData, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      try {
        const updatedUser = await axios.get('http://localhost:3000/api/auth/me');
        setUser(updatedUser.data);
      } catch (err) {
        console.warn('AuthContext - Failed to fetch updated user data after project creation:', err.message);
        setUser(prevUser => ({
          ...prevUser,
          projects: [...(prevUser.projects || []), response.data],
        }));
      }

      socket.emit('project_activity', {
        projectId: response.data.id,
        message: `created project: ${response.data.title}`,
        user: user.email,
      });

      return response.data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Project creation timed out. Please try again.');
      }
      console.error('AuthContext - Add project failed:', err.message);
      throw err;
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates);
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me');
      setUser(updatedUser.data);
      socket.emit('project_activity', {
        projectId: projectId,
        message: `updated project: ${response.data.title}`,
        user: user.email,
      });
      return response.data;
    } catch (err) {
      console.error('AuthContext - Update project failed:', err.message);
      throw err;
    }
  };

  const inviteToProject = async (projectId, email) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${projectId}/invite`, { email });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me');
      setUser(updatedUser.data);
      socket.emit('project_activity', {
        projectId: projectId,
        message: `invited ${email} to the project`,
        user: user.email,
      });
      return response.data;
    } catch (err) {
      console.error('AuthContext - Invite to project failed:', err.message);
      throw err;
    }
  };

  const autoAssignTasks = async (projectId) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${projectId}/tasks/auto-assign`);
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me');
      setUser(updatedUser.data);
      socket.emit('project_activity', {
        projectId: projectId,
        message: `auto-assigned tasks`,
        user: user.email,
      });
      return response.data;
    } catch (err) {
      console.error('AuthContext - Auto-assign tasks failed:', err.message);
      throw err;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authError,
        theme,
        intendedRoute,
        login,
        register,
        logout,
        updateUserProfile,
        addProject,
        updateProject,
        inviteToProject,
        autoAssignTasks,
        toggleTheme,
        setIntendedRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
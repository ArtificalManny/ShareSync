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
  const [notifications, setNotifications] = useState([]);

  const socket = io('http://localhost:3000');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('http://localhost:3000/api/auth/me', { timeout: 15000 });
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          setAuthError('Authentication failed. Please log in again.');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    socket.on('notification', (data) => {
      if (user && (data.userId === user._id || !data.userId)) {
        setNotifications(prev => [...prev, data]);
      }
    });

    socket.on('projectCreated', (data) => {
      if (user && data.userId === user._id) {
        setUser(prev => ({
          ...prev,
          projects: [...(prev.projects || []), data.project._id],
        }));
      }
    });

    socket.on('projectUpdated', (data) => {
      if (user && user.projects.includes(data.projectId)) {
        setUser(prev => ({
          ...prev,
          projects: prev.projects.map(projId => projId === data.projectId ? data.project._id : projId),
        }));
      }
    });

    return () => {
      socket.off('notification');
      socket.off('projectCreated');
      socket.off('projectUpdated');
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password }, { timeout: 15000 });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (err) {
      setAuthError('Login failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', userData, { timeout: 15000 });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (err) {
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
    setNotifications([]);
  };

  const updateUserProfile = async (updates) => {
    try {
      const response = await axios.put('http://localhost:3000/api/auth/me', updates, { timeout: 15000 });
      setUser(response.data);
      return response.data;
    } catch (err) {
      throw new Error('Update profile failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const addProject = async (projectData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/projects', projectData, { timeout: 15000 });
      const newProject = response.data;
      if (!newProject || !newProject._id) {
        throw new Error('Project creation failed: Invalid project data returned.');
      }
      try {
        const updatedUser = await axios.get('http://localhost:3000/api/auth/me', { timeout: 15000 });
        setUser(updatedUser.data);
      } catch (err) {
        setUser(prevUser => ({
          ...prevUser,
          projects: [...(prevUser.projects || []), newProject._id],
        }));
      }
      return newProject;
    } catch (err) {
      throw new Error('Add project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates, { timeout: 15000 });
      const updatedProject = response.data;
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', { timeout: 15000 });
      setUser(updatedUser.data);
      return updatedProject;
    } catch (err) {
      throw new Error('Update project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const inviteToProject = async (projectId, email) => {
    try {
      await axios.post(`http://localhost:3000/api/projects/${projectId}/invite`, { email }, { timeout: 15000 });
    } catch (err) {
      throw new Error('Invite to project failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const autoAssignTasks = async (projectId) => {
    try {
      await axios.post(`http://localhost:3000/api/projects/${projectId}/auto-assign-tasks`, {}, { timeout: 15000 });
    } catch (err) {
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
    notifications,
    setNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
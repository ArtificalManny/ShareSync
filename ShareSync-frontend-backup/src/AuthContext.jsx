import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import authService from './services/auth';

const AuthContext = createContext();

const socket = io('http://localhost:3000');

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalMetrics, setGlobalMetrics] = useState({ notifications: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [intendedRoute, setIntendedRoute] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('AuthContext - No token found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthContext - Initializing with token:', token);
        const userData = await authService.getCurrentUser();
        console.log('AuthContext - User data fetched successfully:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
      } catch (err) {
        console.error('AuthContext - Failed to fetch user data:', err.message);
        setAuthError('Failed to authenticate user: ' + (err.message || 'Unknown error'));
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, redirectTo = '/') => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      setGlobalMetrics({ notifications: data.user.notifications?.length || 0 });
      setIntendedRoute(null);
      console.log('AuthContext - User logged in:', data.user, 'Redirecting to:', redirectTo);
      return redirectTo;
    } catch (err) {
      setAuthError('Login failed: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setGlobalMetrics({ notifications: 0 });
    setIntendedRoute(null);
    socket.disconnect();
    console.log('AuthContext - User logged out');
  };

  const joinProject = (project) => {
    const updatedUser = {
      ...user,
      projects: [...(user.projects || []), project],
    };
    setUser(updatedUser);
  };

  const addProject = (project) => {
    const updatedUser = {
      ...user,
      projects: [...(user.projects || []), project],
    };
    setUser(updatedUser);
  };

  const updateProject = async (projectId, updates) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates);
      const updatedProjects = user.projects.map((proj) =>
        proj.id === projectId ? { ...proj, ...updates } : proj
      );
      setUser({ ...user, projects: updatedProjects });
      console.log('AuthContext - Project updated:', projectId);
      return response.data;
    } catch (err) {
      console.error('AuthContext - Failed to update project:', err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
      console.log('AuthContext - User profile updated:', updatedUser);
    } catch (err) {
      console.error('AuthContext - Failed to update user profile:', err.message);
      throw err;
    }
  };

  const autoAssignTasks = async (projectId) => {
    try {
      const project = user.projects.find((p) => p.id === projectId);
      if (!project || !project.tasks) return;

      const members = project.members || [];
      const tasks = project.tasks || [];
      const updatedTasks = tasks.map((task, index) => ({
        ...task,
        assignedTo: members[index % members.length]?.email || 'Unassigned',
      }));

      await updateProject(projectId, { tasks: updatedTasks });
      console.log('AuthContext - Tasks auto-assigned:', updatedTasks);
    } catch (err) {
      console.error('AuthContext - Error auto-assigning tasks:', err.message);
      throw err;
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        globalMetrics,
        socket,
        login,
        logout,
        joinProject,
        addProject,
        updateProject,
        updateUserProfile,
        isLoading,
        setIntendedRoute,
        intendedRoute,
        theme,
        toggleTheme,
        autoAssignTasks,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
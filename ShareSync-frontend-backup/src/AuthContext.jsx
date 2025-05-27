import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

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
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('AuthContext - Initializing with token:', token);
          const response = await axios.get('http://localhost:3000/api/auth/me');
          const userData = response.data;
          console.log('AuthContext - User data fetched successfully:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
        } catch (err) {
          console.error('AuthContext - Failed to fetch user data:', err.message, err.response?.data);
          setAuthError('Failed to authenticate user: ' + (err.response?.data?.message || err.message));
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('AuthContext - No token found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, redirectTo = '/') => {
    setUser(userData);
    setIsAuthenticated(true);
    setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
    setIntendedRoute(null);
    console.log('AuthContext - User logged in:', userData, 'Redirecting to:', redirectTo);
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return redirectTo;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setGlobalMetrics({ notifications: 0 });
    setIntendedRoute(null);
    socket.disconnect();
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
      await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates);
      const updatedProjects = user.projects.map((proj) =>
        proj.id === projectId ? { ...proj, ...updates } : proj
      );
      setUser({ ...user, projects: updatedProjects });
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      await axios.put('http://localhost:3000/api/auth/me', updates);
      setUser({ ...user, ...updates });
    } catch (err) {
      console.error('Failed to update user profile:', err);
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

      await axios.put(`http://localhost:3000/api/projects/${projectId}`, {
        tasks: updatedTasks,
      });

      const updatedProjects = user.projects.map((proj) =>
        proj.id === projectId ? { ...proj, tasks: updatedTasks } : proj
      );
      setUser({ ...user, projects: updatedProjects });
      console.log('Tasks auto-assigned:', updatedTasks);
    } catch (err) {
      console.error('Error auto-assigning tasks:', err.message);
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
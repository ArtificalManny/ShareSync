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
      console.log('AuthContext - Checking for token in localStorage:', token);
      if (!token) {
        console.log('AuthContext - No token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthContext - Fetching user data with token:', token);
        const userData = await authService.getCurrentUser();
        console.log('AuthContext - User data fetched successfully:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
        setAuthError('');
      } catch (err) {
        console.error('AuthContext - Failed to fetch user data:', err.message);
        setAuthError('Failed to authenticate user: ' + (err.message || 'Unknown error'));
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('AuthContext - Initialization complete. isAuthenticated:', isAuthenticated, 'isLoading:', false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, redirectTo = '/') => {
    try {
      console.log('AuthContext - Attempting login with email:', email);
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      setGlobalMetrics({ notifications: data.user.notifications?.length || 0 });
      setIntendedRoute(null);
      setAuthError('');
      console.log('AuthContext - User logged in:', data.user, 'Redirecting to:', redirectTo);
      return redirectTo;
    } catch (err) {
      console.error('AuthContext - Login failed:', err.message);
      setAuthError('Login failed: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  const logout = () => {
    console.log('AuthContext - Logging out user');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setGlobalMetrics({ notifications: 0 });
    setIntendedRoute(null);
    socket.disconnect();
    setAuthError('');
    console.log('AuthContext - User logged out');
  };

  const addProject = async (project) => {
    try {
      console.log('AuthContext - Adding project:', project.id);
      const response = await axios.post('http://localhost:3000/api/projects', project);
      setUser({ ...user, projects: [...(user?.projects || []), response.data] });
      console.log('AuthContext - Project added:', response.data);
    } catch (err) {
      console.error('AuthContext - Failed to add project:', err.message);
      throw err;
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      console.log('AuthContext - Updating project:', projectId);
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates);
      const updatedProjects = (user?.projects || []).map((proj) =>
        proj.id === projectId ? { ...proj, ...response.data } : proj
      );
      setUser({ ...user, projects: updatedProjects });
      console.log('AuthContext - Project updated:', projectId);
      return response.data;
    } catch (err) {
      console.error('AuthContext - Failed to update project:', err.message);
      throw err;
    }
  };

  const inviteToProject = async (projectId, email) => {
    try {
      console.log('AuthContext - Sending invite for project:', projectId, 'to:', email);
      const response = await axios.post(`http://localhost:3000/api/projects/${projectId}/invite`, { email });
      const updatedProjects = (user?.projects || []).map((proj) =>
        proj.id === projectId ? { ...proj, members: [...proj.members, { email, role: 'Member', profilePicture: 'https://via.placeholder.com/150' }] } : proj
      );
      setUser({ ...user, projects: updatedProjects });
      console.log('AuthContext - Invite sent:', response.data);
      return response.data;
    } catch (err) {
      console.error('AuthContext - Failed to send invite:', err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      console.log('AuthContext - Updating user profile');
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
      console.log('AuthContext - Auto-assigning tasks for project:', projectId);
      const project = (user?.projects || []).find((p) => p.id === projectId);
      if (!project || !project.tasks) {
        console.log('AuthContext - Project or tasks not found for auto-assign:', projectId);
        return;
      }

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
    console.log('AuthContext - Toggling theme to:', newTheme);
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
        addProject,
        updateProject,
        inviteToProject,
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
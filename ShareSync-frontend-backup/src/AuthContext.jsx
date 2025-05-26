import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const AuthContext = createContext();

const socket = io('http://localhost:3000');

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalMetrics, setGlobalMetrics] = useState({ notifications: 0 });

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('http://localhost:3000/api/auth/me');
          const userData = response.data;
          setUser(userData);
          setIsAuthenticated(true);
          setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setGlobalMetrics({ notifications: userData.notifications?.length || 0 });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setGlobalMetrics({ notifications: 0 });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
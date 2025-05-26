import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user'));
  const [socket, setSocket] = useState(null);
  const [globalMetrics, setGlobalMetrics] = useState({
    totalProjects: 0,
    tasksCompleted: 0,
    notifications: 0,
  });

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setGlobalMetrics((prev) => ({
        ...prev,
        totalProjects: user.projects?.length || 0,
        notifications: user.notifications?.length || 0,
      }));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const updateUserProfile = (updatedDetails) => {
    setUser((prev) => {
      const updatedUser = { ...prev, ...updatedDetails };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const joinProject = (project) => {
    setUser((prev) => {
      const updatedProjects = [...(prev.projects || []), project];
      const updatedUser = { ...prev, projects: updatedProjects };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const addProject = (project) => {
    setUser((prev) => {
      const updatedProjects = [...(prev.projects || []), project];
      const updatedUser = { ...prev, projects: updatedProjects };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const updateProject = (projectId, updates) => {
    setUser((prev) => {
      const updatedProjects = prev.projects.map((proj) =>
        proj.id === projectId ? { ...proj, ...updates } : proj
      );
      const updatedUser = { ...prev, projects: updatedProjects };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateUserProfile,
        globalMetrics,
        socket,
        joinProject,
        addProject,
        updateProject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
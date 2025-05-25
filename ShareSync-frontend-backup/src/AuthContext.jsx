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
    setUser((prev) => ({ ...prev, ...updatedDetails }));
  };

  const joinProject = (project) => {
    setUser((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), project],
    }));
  };

  const addProject = (project) => {
    setUser((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), project],
    }));
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
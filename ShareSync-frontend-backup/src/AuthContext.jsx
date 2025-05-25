import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

// Initialize socket with error handling
let socket;
try {
  socket = io('http://localhost:3000', { autoConnect: false });
} catch (error) {
  console.error('Failed to initialize socket:', error.message);
  socket = null;
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [globalMetrics, setGlobalMetrics] = useState({
    totalProjects: 0,
    tasksCompleted: 0,
    notifications: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setUser({
        email: 'user@example.com',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        job: 'Developer',
        school: 'University of Example',
        profilePicture: 'https://via.placeholder.com/150',
        bannerPicture: 'https://via.placeholder.com/1200x300',
        projects: [], // Start with no projects
      });
      setGlobalMetrics({
        totalProjects: 0,
        tasksCompleted: 0,
        notifications: 0,
      });
    }

    if (socket) {
      socket.connect();
      socket.on('connect', () => console.log('Socket connected'));
      socket.on('connect_error', (error) => console.error('Socket connection error:', error.message));
      socket.on('notification', (notification) => {
        setGlobalMetrics((prev) => ({
          ...prev,
          notifications: prev.notifications + 1,
        }));
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('notification');
        socket.disconnect();
      };
    }
  }, []);

  const login = async (email, password) => {
    localStorage.setItem('token', 'mock-token');
    setIsAuthenticated(true);
    setUser({
      email,
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      job: 'Developer',
      school: 'University of Example',
      profilePicture: 'https://via.placeholder.com/150',
      bannerPicture: 'https://via.placeholder.com/1200x300',
      projects: [],
    });
    setGlobalMetrics({
      totalProjects: 0,
      tasksCompleted: 0,
      notifications: 0,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setGlobalMetrics({ totalProjects: 0, tasksCompleted: 0, notifications: 0 });
    if (socket) socket.disconnect();
  };

  const createProject = async (projectData) => {
    const newProject = {
      id: `proj${Date.now()}`,
      ...projectData,
    };
    setUser((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), newProject],
    }));
    setGlobalMetrics((prev) => ({
      ...prev,
      totalProjects: prev.totalProjects + 1,
    }));
  };

  const joinProject = (project) => {
    setUser((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), project],
    }));
    setGlobalMetrics((prev) => ({
      ...prev,
      totalProjects: prev.totalProjects + 1,
    }));
  };

  const updateUserProfile = (updatedProfile) => {
    setUser((prev) => ({ ...prev, ...updatedProfile }));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        createProject,
        joinProject,
        updateUserProfile,
        globalMetrics,
        socket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [globalMetrics, setGlobalMetrics] = useState({
    totalProjects: 0,
    notifications: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:3000/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        setUser({ ...JSON.parse(localStorage.getItem('user')), projects: response.data });
        setIsAuthenticated(true);
        setGlobalMetrics({
          totalProjects: response.data.length,
          notifications: 0, // Update based on backend data if needed
        });
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      });
    }

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser((prev) => ({ ...prev, projects: projectsResponse.data }));
      setGlobalMetrics({
        totalProjects: projectsResponse.data.length,
        notifications: 0,
      });
    } catch (err) {
      throw new Error('Login failed: ' + err.response?.data?.message || err.message);
    }
  };

  const register = async (username, firstName, lastName, email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        username,
        firstName,
        lastName,
        email,
        password,
      });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setGlobalMetrics({
        totalProjects: 0,
        notifications: 0,
      });
    } catch (err) {
      throw new Error('Registration failed: ' + err.response?.data?.message || err.message);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUserProfile = async (updatedDetails) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/users/${user.id}`, updatedDetails, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = { ...user, ...updatedDetails };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to update user profile:', err);
    }
  };

  const joinProject = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/projects', project, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newProject = response.data;
      setUser((prev) => {
        const updatedUser = { ...prev, projects: [...(prev.projects || []), newProject] };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      setGlobalMetrics((prev) => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
    } catch (err) {
      console.error('Failed to join project:', err);
    }
  };

  const addProject = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/projects', project, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newProject = response.data;
      setUser((prev) => {
        const updatedUser = { ...prev, projects: [...(prev.projects || []), newProject] };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      setGlobalMetrics((prev) => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:3000/api/projects/${projectId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedProject = response.data;
      setUser((prev) => {
        const updatedProjects = prev.projects.map((proj) =>
          proj.id === projectId ? updatedProject : proj
        );
        const updatedUser = { ...prev, projects: updatedProjects };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
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
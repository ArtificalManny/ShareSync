import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, profilePic?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      window.location.reload(); // Refresh to update UI
    } else {
      throw new Error('Login failed');
    }
  };

  const register = async (username: string, password: string, profilePic?: string) => {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, profilePic }),
    });
    const data = await response.json();
    if (data) {
      localStorage.setItem('currentUser', JSON.stringify(data));
      window.location.reload(); // Refresh to update UI
    } else {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload(); // Refresh to update UI
  };

  const user = JSON.parse(localStorage.getItem('currentUser') || 'null') as User | null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
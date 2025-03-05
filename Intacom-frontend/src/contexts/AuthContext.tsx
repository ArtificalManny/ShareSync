import React, { createContext, useContext, useState, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

interface AuthContextType {
  user: { username: string; profilePic: string } | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, profilePic?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string; profilePic: string } | null>(null);

  const login = async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    setUser(response.data.user);
  };

  const register = async (username: string, password: string, profilePic?: string) => {
    const response = await apiRegister(username, password, profilePic);
    setUser(response.data);
  };

  const logout = () => {
    setUser(null);
    document.cookie = 'userToken=; Max-Age=0; path=/'; // Clear cookie
  };

  const value = { user, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: { _id: string; username: string; email: string } | null;
  setUser: (user: { _id: string; username: string; email: string } | null) => void;
  login: (user: { _id: string; username: string; email: string }) => void;
  register: (user: { _id: string; username: string; email: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ _id: string; username: string; email: string } | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (user: { _id: string; username: string; email: string }) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const register = (user: { _id: string; username: string; email: string }) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
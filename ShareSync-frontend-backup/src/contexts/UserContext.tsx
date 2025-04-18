import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

interface User {
  _id: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/auth/me', { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          setUser(null);
          localStorage.removeItem('token');
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
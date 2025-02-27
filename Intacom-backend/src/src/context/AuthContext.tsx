import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the shape of your user object
interface User {
  id: string;
  name: string;
  profilePicture?: string;
  // ...any other fields from your backend
}

// Define what our context will provide
interface AuthContextProps {
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // On app load, check if a token is saved and fetch user data
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // Attempt to fetch user data with the token
      fetchUserProfile(savedToken);
    }
  }, []);

  // Fetch user profile from the backend using the stored token
  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: User = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error(err);
      // If there's an error, remove token, set user to null
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Called after a successful login
  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await fetchUserProfile(token);
  };

  // Log out the user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// A helper hook to use the AuthContext in other components
export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Recover from './pages/Recover';
import ResetPassword from './pages/ResetPassword';
import ProjectHome from './pages/ProjectHome';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App.tsx: Initializing user state...');
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('App.tsx: User loaded from localStorage:', parsedUser);
      } catch (error) {
        console.error('App.tsx: Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      console.log('App.tsx: No user or token found in localStorage.');
    }
    setLoading(false);
    console.log('App.tsx: Loading state set to false.');
  }, []);

  const handleLogout = async () => {
    try {
      console.log('App.tsx: Logging out...');
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log('App.tsx: Logout successful.');
    } catch (err) {
      console.error('App.tsx: Error logging out:', err);
    }
  };

  if (loading) {
    console.log('App.tsx: Rendering loading state...');
    return <div style={styles.loading}>Loading...</div>;
  }

  console.log('App.tsx: Rendering main app, user:', user);

  return (
    <Router>
      <div style={styles.appContainer}>
        {user && <Header />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/recover" element={<Recover />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/projects" element={user ? <Projects user={user} /> : <Navigate to="/login" />} />
          <Route path="/project/:id" element={user ? <ProjectHome user={user} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Notifications user={user} /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          <Route path="/logout" element={<Navigate to="/login" replace state={{ logout: handleLogout }} />} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
};

// Basic styles for loading and app container
const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    minHeight: '100vh',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textShadow: '0 0 10px #A2E4FF',
  },
};

export default App;
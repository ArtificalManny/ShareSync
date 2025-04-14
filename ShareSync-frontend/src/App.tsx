import React, { useState, useEffect, Suspense } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  console.log('App.tsx: Component initialized.');

  useEffect(() => {
    console.log('App.tsx: useEffect running to initialize user state...');
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('App.tsx: User loaded from localStorage:', parsedUser);
      } else {
        console.log('App.tsx: No user or token found in localStorage.');
      }
    } catch (err) {
      console.error('App.tsx: Error initializing user:', err);
      setError('Failed to initialize user. Please try again.');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
      console.log('App.tsx: Loading state set to false.');
    }
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

  if (error) {
    console.log('App.tsx: Rendering error state...');
    return (
      <div style={styles.errorContainer}>
        <h1 style={styles.errorHeading}>Error</h1>
        <p style={styles.errorMessage}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.errorButton}>
          Reload Page
        </button>
      </div>
    );
  }

  if (loading) {
    console.log('App.tsx: Rendering loading state...');
    return <div style={styles.loading}>Loading...</div>;
  }

  console.log('App.tsx: Rendering main app, user:', user);

  return (
    <Router>
      <div style={styles.appContainer}>
        {user && <Header />}
        <Suspense fallback={<div style={styles.loading}>Loading...</div>}>
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
        </Suspense>
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
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    textAlign: 'center',
    padding: '20px',
  },
  errorHeading: {
    fontSize: '32px',
    textShadow: '0 0 15px #A2E4FF',
    marginBottom: '20px',
  },
  errorMessage: {
    fontSize: '18px',
    color: '#FF6F91',
    marginBottom: '20px',
  },
  errorButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);

export default App;
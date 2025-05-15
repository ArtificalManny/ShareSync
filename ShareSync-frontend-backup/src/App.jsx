import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { getUserDetails } from './utils/api';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import './index.css';

// Icons with subtle animations for dopamine hits
const HomeIcon = () => (
  <svg className="w-6 h-6 animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 2v7h4v-7m-4 0H5l7-7"></path>
  </svg>
);

const ProjectsIcon = () => (
  <svg className="w-6 h-6 animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-6 h-6 animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
  </svg>
);

const MessagesIcon = () => (
  <svg className="w-6 h-6 animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5 animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

// ProtectedRoute component with improved logic
const ProtectedRoute = ({ user, loading, children }) => {
  const hasToken = !!localStorage.getItem('token');
  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }
  if (!hasToken || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const hasToken = !!localStorage.getItem('token');

  useEffect(() => {
    console.log('App.jsx useEffect - hasToken:', hasToken, 'user:', user);
    const fetchUser = async () => {
      try {
        const userData = await getUserDetails();
        console.log('Fetched user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to fetch user details:', err.message);
        // Clear invalid token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } finally {
        setLoading(false);
        console.log('Loading state set to false');
      }
    };

    if (hasToken && !user) {
      fetchUser();
    } else {
      setLoading(false);
      console.log('No token or user already set, loading set to false');
    }
  }, [hasToken, user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  console.log('Rendering App.jsx - loading:', loading, 'user:', user);

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  return (
    <div className={hasToken ? 'main-content' : 'auth-page'}>
      {hasToken && user && (
        <>
          <header className="header">
            <h1 className="header-logo" onClick={() => navigate('/')}>ShareSync</h1>
            <div className="header-search mx-auto">
              <input type="text" placeholder="Search ShareSync..." className="search-input" />
            </div>
            <div className="header-nav flex space-x-4 items-center">
              <button onClick={() => navigate('/')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink transition-all">
                <HomeIcon />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button onClick={() => navigate('/projects')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink transition-all">
                <ProjectsIcon />
                <span className="hidden sm:inline">Projects</span>
              </button>
              <button onClick={() => navigate('/notifications')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink relative transition-all">
                <NotificationsIcon />
                <span className="hidden sm:inline">Notifications</span>
                <span className="absolute top-0 right-0 bg-vibrant-pink text-white text-xs rounded-full px-2 py-1 animate-pulse-glow">3</span>
              </button>
              <button onClick={() => navigate('/messages')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink relative transition-all">
                <MessagesIcon />
                <span className="hidden sm:inline">Messages</span>
                <span className="absolute top-0 right-0 bg-vibrant-pink text-white text-xs rounded-full px-2 py-1 animate-pulse-glow">5</span>
              </button>
              <div className="header-user relative">
                <img
                  src={user?.profilePicture || 'https://via.placeholder.com/40'}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full animate-pulse-glow"
                />
                <span className="hidden sm:inline text-white ml-2">{user?.username || 'User'}</span>
                <div className="dropdown">
                  <button onClick={() => navigate('/profile')} className="dropdown-item">Profile</button>
                  <button onClick={() => navigate('/settings')} className="dropdown-item">
                    <div className="flex items-center space-x-1">
                      <SettingsIcon />
                      <span>Settings</span>
                    </div>
                  </button>
                  <button onClick={handleLogout} className="dropdown-item">Logout</button>
                </div>
              </div>
            </div>
          </header>

          <nav className="sidebar">
            <ul>
              <li>
                <button onClick={() => navigate('/')} className="flex items-center space-x-2 sidebar-item">
                  <HomeIcon />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/projects')} className="flex items-center space-x-2 sidebar-item">
                  <ProjectsIcon />
                  <span>Projects</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/profile')} className="flex items-center space-x-2 sidebar-item">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/24'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full animate-pulse-glow"
                  />
                  <span>Profile</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/notifications')} className="flex items-center space-x-2 relative sidebar-item">
                  <NotificationsIcon />
                  <span>Notifications</span>
                  <span className="absolute top-0 left-5 bg-vibrant-pink text-white text-xs rounded-full px-2 py-1 animate-pulse-glow">3</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/messages')} className="flex items-center space-x-2 relative sidebar-item">
                  <MessagesIcon />
                  <span>Messages</span>
                  <span className="absolute top-0 left-5 bg-vibrant-pink text-white text-xs rounded-full px-2 py-1 animate-pulse-glow">5</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/settings')} className="flex items-center space-x-2 sidebar-item">
                  <SettingsIcon />
                  <span>Settings</span>
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute user={user} loading={loading}><Home user={user} /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} loading={loading}><Projects user={user} /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute user={user} loading={loading}><ProjectHome user={user} setUser={setUser} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user} loading={loading}><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute user={user} loading={loading}><Notifications user={user} /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute user={user} loading={loading}><Messages user={user} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} loading={loading}><Settings user={user} setUser={setUser} /></ProtectedRoute>} />
      </Routes>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
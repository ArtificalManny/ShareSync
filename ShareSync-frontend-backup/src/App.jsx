import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { getUserDetails } from './utils/api';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './index.css';

// Icons (Using SVG placeholders for now, replace with actual icons as needed)
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 2v7h4v-7m-4 0H5l7-7"></path>
  </svg>
);

const ProjectsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
  </svg>
);

const MessagesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserDetails();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user details:', err.message);
      }
    };

    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <div className={isAuthenticated ? 'main-content' : 'auth-page'}>
      {isAuthenticated && (
        <>
          <header className="header">
            <h1 className="header-logo" onClick={() => navigate('/')}>ShareSync</h1>
            <div className="header-search mx-auto">
              <input type="text" placeholder="Search ShareSync..." />
            </div>
            <div className="header-nav flex space-x-4 items-center">
              <button onClick={() => navigate('/')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink">
                <HomeIcon />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button onClick={() => navigate('/projects')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink">
                <ProjectsIcon />
                <span className="hidden sm:inline">Projects</span>
              </button>
              <button onClick={() => navigate('/notifications')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink">
                <NotificationsIcon />
                <span className="hidden sm:inline">Notifications</span>
              </button>
              <button onClick={() => navigate('/messages')} className="flex items-center space-x-1 text-white hover:text-vibrant-pink">
                <MessagesIcon />
                <span className="hidden sm:inline">Messages</span>
              </button>
              <div className="header-user">
                <img
                  src={user?.profilePicture || 'https://via.placeholder.com/40'}
                  alt="User Avatar"
                />
                <span className="hidden sm:inline">{user ? user.username : 'User'}</span>
                <div className="dropdown">
                  <button onClick={() => navigate('/profile')}>Profile</button>
                  <button onClick={() => navigate('/settings')}>
                    <div className="flex items-center space-x-1">
                      <SettingsIcon />
                      <span>Settings</span>
                    </div>
                  </button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </div>
          </header>

          <nav className="sidebar">
            <ul>
              <li>
                <button onClick={() => navigate('/')} className="flex items-center space-x-2">
                  <HomeIcon />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/projects')} className="flex items-center space-x-2">
                  <ProjectsIcon />
                  <span>Projects</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/profile')} className="flex items-center space-x-2">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/24'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full"
                  />
                  <span>Profile</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/notifications')} className="flex items-center space-x-2">
                  <NotificationsIcon />
                  <span>Notifications</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/messages')} className="flex items-center space-x-2">
                  <MessagesIcon />
                  <span>Messages</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/settings')} className="flex items-center space-x-2">
                  <SettingsIcon />
                  <span>Settings</span>
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/notifications" element={<div className="text-white text-center mt-10">Notifications Page (Placeholder)</div>} />
        <Route path="/messages" element={<div className="text-white text-center mt-10">Messages Page (Placeholder)</div>} />
        <Route path="/settings" element={<div className="text-white text-center mt-10">Settings Page (Placeholder)</div>} />
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
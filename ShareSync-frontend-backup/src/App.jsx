// App.jsx
import React, { useState, useReducer, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import { AuthProvider } from './AuthContext';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProjectHome from './pages/ProjectHome';
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";

const searchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    default:
      return state;
  }
};

const App = () => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', suggestions: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('purple');
  const [feedItems, setFeedItems] = useState([]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      alert(`Navigate to search results for: ${searchState.query}`);
      setIsSearchOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev);
    if (isNotificationDropdownOpen) setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(prev => !prev);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const changeAccentColor = (color) => {
    setAccentColor(color);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedItems(prev => [
        ...prev,
        {
          projectId: '1',
          projectTitle: 'Project Alpha',
          type: 'activity',
          message: `New update at ${new Date().toLocaleTimeString()}`,
          user: 'user@example.com',
          profilePicture: 'https://via.placeholder.com/40',
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
          shares: 0,
        },
      ]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar
            user={user}
            setUser={setUser}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <div className="main-content">
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/create-account" element={<CreateAccount />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
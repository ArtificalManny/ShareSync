import React, { useState, useReducer } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import { AuthContext } from './AuthContext';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', suggestions: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('purple');

  // Mock AuthContext value
  const [authState] = useState({
    user: {
      username: 'user',
      email: 'user@example.com',
      firstName: 'User',
      profilePicture: 'https://via.placeholder.com/40',
      projects: [
        {
          _id: '1',
          title: 'Project Alpha',
          status: 'In Progress',
          activityLog: [
            { message: 'Updated project plan', user: 'user@example.com', timestamp: new Date().toISOString() }
          ],
          posts: [],
          tasks: [],
          files: [],
          members: ['user@example.com'],
        },
        {
          _id: '2',
          title: 'Project Beta',
          status: 'In Progress',
          activityLog: [],
          posts: [
            { content: 'New announcement posted', author: 'user@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() }
          ],
          tasks: [],
          files: [],
          members: ['user@example.com'],
        }
      ]
    },
    isAuthenticated: true,
    isLoading: false,
    authError: null,
    socket: null,
    fetchUserData: () => Promise.resolve(),
  });

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      alert(`Navigate to search results for: ${searchState.query} (Implement search results page.)`);
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

  return (
    <AuthContext.Provider value={authState}>
      <Router>
        <div className={`app-container ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar
            searchState={searchState}
            dispatchSearch={dispatchSearch}
            handleSearchSubmit={handleSearchSubmit}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            accentColor={accentColor}
            notifications={notifications}
            toggleNotificationDropdown={toggleNotificationDropdown}
            isNotificationDropdownOpen={isNotificationDropdownOpen}
            toggleProfileDropdown={toggleProfileDropdown}
            isProfileDropdownOpen={isProfileDropdownOpen}
            user={authState.user}
            changeAccentColor={changeAccentColor}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <Routes>
            <Route path="/" element={
              <Home
                searchState={searchState}
                dispatchSearch={dispatchSearch}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            } />
            <Route path="/projects" element={
              <Projects
                searchState={searchState}
                dispatchSearch={dispatchSearch}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            } />
            <Route path="/projects/:id" element={<div>Project Detail Page (To be implemented)</div>} />
            <Route path="/profile/:username" element={<div>Profile Page (To be implemented)</div>} />
            <Route path="/chat/:projectId" element={<div>Chat Page (To be implemented)</div>} />
            <Route path="/login" element={<div>Login Page (To be implemented)</div>} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
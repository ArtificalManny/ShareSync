import React, { useState, useReducer, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import { AuthContext } from './AuthContext';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProjectHome from './pages/ProjectHome';

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
  const [feedItems, setFeedItems] = useState([]);

  const [authState] = useState({
    user: {
      _id: 'user1',
      username: 'User',
      email: 'user@example.com',
      firstName: 'User',
      profilePicture: 'https://via.placeholder.com/40',
      projects: [
        {
          _id: '1',
          title: 'Project Alpha',
          status: 'In Progress',
          activityLog: [{ message: 'Updated project plan', user: 'user@example.com', timestamp: new Date().toISOString() }],
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
          posts: [{ content: 'New announcement posted', author: 'user@example.com', timestamp: new Date().toISOString() }],
          tasks: [],
          files: [],
          members: ['user@example.com'],
        },
      ],
    },
    isAuthenticated: true,
    isLoading: false,
    authError: null,
    socket: {
      on: (event, callback) => {
        if (event === 'feed-update') callback({ message: 'New activity', timestamp: new Date().toISOString() });
      },
      emit: (event, data) => {
        if (event === 'feed-like' || event === 'feed-comment' || event === 'feed-share') {
          setFeedItems(prev => [...prev, data.item].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          setNotifications(prev => [...prev, { message: `${authState.user.username} ${event.replace('feed-', '')}d an item`, timestamp: new Date().toISOString() }]);
        }
      },
      off: () => {},
    },
    fetchUserData: () => Promise.resolve(),
  });

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
          user: authState.user.email,
          profilePicture: authState.user.profilePicture,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
          shares: 0,
        },
      ]);
    }, 30000);
    return () => clearInterval(interval);
  }, [authState.user.email, authState.user.profilePicture]);

  return (
    <AuthContext.Provider value={authState}>
      <Router>
        <div className="app-container min-h-screen flex flex-row">
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Home
              searchState={searchState}
              dispatchSearch={dispatchSearch}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              notifications={notifications}
              setNotifications={setNotifications}
              feedItems={feedItems}
              setFeedItems={setFeedItems}
            />
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
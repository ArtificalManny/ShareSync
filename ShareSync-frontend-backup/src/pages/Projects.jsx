import React, { useState, useEffect, useContext, useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ChevronDown, Menu, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import './Projects.css';

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

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', suggestions: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('blue');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchProjects = () => {
      try {
        const userProjects = user.projects || [];
        setProjects(userProjects);
      } catch (err) {
        setError('Failed to load projects: ' + (err.message || 'Please try again.'));
      }
    };

    fetchProjects();
  }, [isAuthenticated, isLoading, navigate, user]);

  useEffect(() => {
    if (searchState.query.length > 0) {
      const suggestions = (user?.projects || [])
        .filter(project => project.title.toLowerCase().includes(searchState.query.toLowerCase()))
        .map(project => project.title)
        .slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user]);

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

  if (isLoading) {
    return (
      <div className="projects-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading projects page"></div>
          <span className="text-gray-600 dark:text-gray-400 text-xl font-lato ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="projects-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-lato flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {authError || error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`projects-container flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} relative`}>
      {/* Navbar */}
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
        user={user}
        changeAccentColor={changeAccentColor}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Fallback UI if not authenticated */}
      {(!isAuthenticated || !user) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loader mx-auto mb-4" aria-label="Redirecting to login"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-lato">
              Redirecting to login...
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isAuthenticated && user && (
        <div className="flex flex-1 mt-14 relative z-10">
          <main className="main-content flex-1 p-4 sm:p-6">
            <div className="projects-header mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Folder className="w-5 h-5 text-blue-accent" aria-hidden="true" />
                <h1 className="text-lg sm:text-xl font-poppins font-semibold text-gray-800 dark:text-gray-200">
                  Your Projects
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-lato">
                Manage and view all your projects here.
              </p>
            </div>

            <div className="projects-list">
              {projects.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-lato text-sm">
                  <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" /> No projects found.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(project => (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="project-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:border-blue-accent hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-transform duration-200 transform hover:scale-102"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="w-4 h-4 text-blue-accent" aria-hidden="true" />
                        <h3 className="text-md font-poppins font-medium text-gray-800 dark:text-gray-200">
                          {project.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-lato mb-2">
                        Status: {project.status || 'Not Started'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                        <span className="text-gray-600 dark:text-gray-400 text-xs font-lato">
                          {project.members?.length || 0} members
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default Projects;
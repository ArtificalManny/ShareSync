import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, BellRing, User, MoonStar, Sun } from 'lucide-react';

const Navbar = ({
  searchState,
  dispatchSearch,
  handleSearchSubmit,
  isSearchOpen,
  setIsSearchOpen,
  accentColor,
  notifications,
  toggleNotificationDropdown,
  isNotificationDropdownOpen,
  toggleProfileDropdown,
  isProfileDropdownOpen,
  user,
  changeAccentColor,
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <nav className="navbar fixed top-0 left-0 h-full w-16 bg-white dark:bg-gray-800 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg z-50">
      <div className="flex flex-col items-center justify-between h-full py-4">
        {/* Logo */}
        <div className="mb-6">
          <Link to="/">
            <h1 className="text-xl font-sans font-bold text-purple-500">S</h1>
          </Link>
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col items-center space-y-6">
          <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200">
            <Home className="w-6 h-6" style={{ stroke: `url(#home-gradient-${accentColor})` }} aria-hidden="true" />
          </Link>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200"
            aria-label={isSearchOpen ? "Close search" : "Open search"}
          >
            <Search className="w-6 h-6" style={{ stroke: `url(#search-gradient-${accentColor})` }} aria-hidden="true" />
          </button>
          <div className="relative">
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200"
              aria-label="Notifications"
              onClick={toggleNotificationDropdown}
              aria-expanded={isNotificationDropdownOpen}
            >
              <BellRing className="w-6 h-6" style={{ stroke: `url(#bell-gradient-${accentColor})` }} aria-hidden="true" />
            </button>
            {notifications.length > 0 && (
              <span className="absolute top-[-5px] right-[-5px] w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                {notifications.length}
              </span>
            )}
            {isNotificationDropdownOpen && (
              <div className="absolute left-16 top-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto" role="region" aria-live="polite">
                {notifications.length === 0 ? (
                  <div className="px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      {notification.message}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp || new Date().toISOString()).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={toggleProfileDropdown}
              className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200"
              aria-label="Profile menu"
              aria-expanded={isProfileDropdownOpen}
            >
              <User className="w-6 h-6" aria-hidden="true" />
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute left-16 top-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                <Link
                  to={`/profile/${user.username}`}
                  className="block px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => toggleProfileDropdown()}
                >
                  Profile
                </Link>
                <div className="px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300">
                  Accent Color:
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => changeAccentColor('purple')}
                      className="w-6 h-6 bg-purple-500 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300"
                      aria-label="Select purple accent color"
                    />
                    <button
                      onClick={() => changeAccentColor('pink')}
                      className="w-6 h-6 bg-pink-500 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300"
                      aria-label="Select pink accent color"
                    />
                    <button
                      onClick={() => changeAccentColor('teal')}
                      className="w-6 h-6 bg-teal-400 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-300"
                      aria-label="Select teal accent color"
                    />
                  </div>
                </div>
                <div className="px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Dark Mode:
                  <button
                    onClick={() => {
                      toggleDarkMode();
                    }}
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? <Sun className="w-6 h-6" aria-hidden="true" /> : <MoonStar className="w-6 h-6" aria-hidden="true" />}
                  </button>
                </div>
                <button
                  className="block w-full text-left px-4 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    toggleProfileDropdown();
                    alert('Logout functionality to be implemented.');
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mt-6">
          <button
            onClick={() => {
              toggleDarkMode();
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="w-6 h-6" aria-hidden="true" /> : <MoonStar className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <svg className="absolute w-0 h-0">
        <linearGradient id={`home-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`search-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`bell-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`home-gradient-pink`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`search-gradient-pink`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`bell-gradient-pink`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`home-gradient-teal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`search-gradient-teal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`bell-gradient-teal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
      </svg>
    </nav>
  );
};

export default Navbar;
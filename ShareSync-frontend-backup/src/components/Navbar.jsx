import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Folder, Settings, Sun, Moon } from 'lucide-react';

/**
 * Fixed left sidebar with:
 *  • User avatar + name at top
 *  • Nav links in the middle
 *  • Dark mode toggle & logout at bottom
 */
export default function Navbar({ user, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <nav className="fixed inset-y-0 left-0 w-20 md:w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between py-6 z-50">
      {/* TOP: Profile */}
      <div className="flex flex-col items-center space-y-3 px-2">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-16 h-16 rounded-full ring-4 ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center">
          {user.name}
        </span>
      </div>

      {/* MIDDLE: Links */}
      <div className="flex flex-col items-center space-y-6 mt-8">
        <Link to="/" className="group flex flex-col items-center">
          <Home className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Home
          </span>
        </Link>

        <Link to="/projects" className="group flex flex-col items-center">
          <Folder className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Projects
          </span>
        </Link>

        <Link to="/settings" className="group flex flex-col items-center">
          <Settings className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Settings
          </span>
        </Link>
      </div>

      {/* BOTTOM: Dark Mode & Logout */}
      <div className="flex flex-col items-center space-y-6 px-2">
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Dark Mode"
          className="group flex flex-col items-center focus:outline-none"
        >
          {isDarkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600" />
          )}
          <span className="mt-1 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {isDarkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="group flex flex-col items-center text-gray-800 dark:text-gray-200 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M17 16l4-4m0 0l-4-4m4 4H7"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-1 text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
}

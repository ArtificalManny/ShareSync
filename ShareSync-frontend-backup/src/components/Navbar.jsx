import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Folder, Settings, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <nav className="fixed inset-y-0 left-0 w-16 md:w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between py-4 z-50 group">
      {/* PROFILE */}
      <div className="flex flex-col items-center space-y-1">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-10 h-10 rounded-full ring-2 ring-indigo-500"
        />
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
          {user.name}
        </span>
      </div>

      {/* NAV LINKS */}
      <div className="flex flex-col items-center space-y-6">
        <Link to="/" className="group flex flex-col items-center">
          <Home className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            Home
          </span>
        </Link>
        <Link to="/projects" className="group flex flex-col items-center">
          <Folder className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            Projects
          </span>
        </Link>
        <Link to="/settings" className="group flex flex-col items-center">
          <Settings className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            Settings
          </span>
        </Link>
      </div>

      {/* TOGGLES */}
      <div className="flex flex-col items-center space-y-6">
        <button
          onClick={toggleDarkMode}
          className="group flex flex-col items-center focus:outline-none"
        >
          {isDarkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600" />
          )}
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            {isDarkMode ? 'Light' : 'Dark'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="group flex flex-col items-center focus:outline-none text-gray-800 dark:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
}

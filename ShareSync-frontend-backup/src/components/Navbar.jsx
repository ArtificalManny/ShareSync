import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Folder, Settings, MoonStar, Sun } from 'lucide-react';

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
    <nav className="navbar fixed top-0 left-0 h-screen w-14 bg-transparent text-gray-900 dark:text-gray-100 font-sans z-50">
      <div className="flex flex-col items-center justify-between h-full py-2">
        <div className="mb-4"><Link to="/"><span className="text-base font-sans font-bold text-purple-600">S</span></Link></div>
        <div className="flex flex-col items-center space-y-6">
          <Link to="/" title="Home" className="group flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200" onClick={() => console.log('Navigated to Home')}>
            <Home className="w-6 h-6" />
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">Home</span>
          </Link>
          <Link to="/projects" title="Projects" className="group flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200" onClick={() => console.log('Navigated to Projects')}>
            <Folder className="w-6 h-6" />
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">Projects</span>
          </Link>
          <Link to="/settings" title="Settings" className="group flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200" onClick={() => console.log('Navigated to Settings')}>
            <Settings className="w-6 h-6" />
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">Settings</span>
          </Link>
        </div>
        <div><button onClick={() => { toggleDarkMode(); console.log('Dark mode toggled'); }} title="Toggle Dark Mode" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 focus:outline-none transition-colors duration-200"><span className="sr-only">Toggle Dark Mode</span>{isDarkMode ? <Sun className="w-6 h-6" /> : <MoonStar className="w-6 h-6" />}</button></div>
      </div>
    </nav>
  );
};

export default Navbar;
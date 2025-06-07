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
    <nav className="navbar fixed top-0 left-0 h-full w-10 sm:w-12 bg-white dark:bg-gray-900 shadow-sm z-50">
      <div className="flex flex-col items-center justify-between h-full py-1 sm:py-2">
        <div className="mb-2 sm:mb-3"><Link to="/"><span className="text-base sm:text-lg font-sans font-bold text-purple-500">S</span></Link></div>
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <Link to="/" title="Home" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200 hover-glow"><Home className="w-4 h-4 sm:w-5 h-5" style={{ stroke: `url(#home-gradient-${accentColor})` }} /></Link>
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} title="Search" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200 hover-glow"><Search className="w-4 h-4 sm:w-5 h-5" style={{ stroke: `url(#search-gradient-${accentColor})` }} /></button>
          <div className="relative">
            <button onClick={toggleNotificationDropdown} title="Notifications" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200 hover-glow"><BellRing className="w-4 h-4 sm:w-5 h-5" style={{ stroke: `url(#bell-gradient-${accentColor})` }} /></button>
            {notifications.length > 0 && <span className="absolute top-[-3px] right-[-3px] w-3 h-3 sm:w-4 h-4 bg-rose-500 text-white text-[8px] sm:text-xs rounded-full flex items-center justify-center">{notifications.length}</span>}
            {isNotificationDropdownOpen && (
              <div className="absolute left-12 sm:left-14 top-0 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div key={i} className="px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    {n.message} <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={toggleProfileDropdown} title="Profile" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 transition-colors duration-200 hover-glow"><User className="w-4 h-4 sm:w-5 h-5" /></button>
            {isProfileDropdownOpen && (
              <div className="absolute left-12 sm:left-14 top-0 w-40 sm:w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <Link to={`/profile/${user.username}`} onClick={toggleProfileDropdown} className="block px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</Link>
                <div className="px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300">Accent Color: <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1"><button onClick={() => changeAccentColor('purple')} className="w-4 h-4 sm:w-5 h-5 bg-purple-500 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300" /><button onClick={() => changeAccentColor('teal')} className="w-4 h-4 sm:w-5 h-5 bg-teal-400 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-300" /><button onClick={() => changeAccentColor('rose')} className="w-4 h-4 sm:w-5 h-5 bg-rose-500 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-300" /></div></div>
                <div className="px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 flex items-center gap-0.5 sm:gap-1">Dark Mode: <button onClick={toggleDarkMode} className="hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500">{isDarkMode ? <Sun className="w-4 h-4 sm:w-5 h-5" /> : <MoonStar className="w-4 h-4 sm:w-5 h-5" />}</button></div>
                <button onClick={() => { toggleProfileDropdown(); alert('Logout to be implemented'); }} className="block w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
              </div>
            )}
          </div>
        </div>
        <div><button onClick={toggleDarkMode} title="Toggle Dark Mode" className="text-gray-600 dark:text-gray-300 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 hover-glow"><span className="sr-only">Toggle Dark Mode</span>{isDarkMode ? <Sun className="w-4 h-4 sm:w-5 h-5" /> : <MoonStar className="w-4 h-4 sm:w-5 h-5" />}</button></div>
      </div>
      <svg className="absolute w-0 h-0">
        <linearGradient id="home-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="home-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="home-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} /></linearGradient>
      </svg>
    </nav>
  );
};

export default Navbar;
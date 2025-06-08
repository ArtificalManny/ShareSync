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
    <nav className="navbar fixed top-0 left-0 h-screen w-14 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans z-50">
      <div className="flex flex-col items-center justify-between h-full py-2">
        <div className="mb-4"><Link to="/"><span className="text-base font-sans font-bold text-purple-600">S</span></Link></div>
        <div className="flex flex-col items-center space-y-4">
          <Link to="/" title="Home" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200" onClick={() => console.log('Navigated to Home')}><Home className="w-6 h-6" style={{ stroke: `url(#home-gradient-${accentColor})` }} /></Link>
          <button onClick={() => { setIsSearchOpen(!isSearchOpen); console.log('Search toggled'); }} title="Search" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><Search className="w-6 h-6" style={{ stroke: `url(#search-gradient-${accentColor})` }} /></button>
          <div className="relative">
            <button onClick={() => { toggleNotificationDropdown(); console.log('Notifications toggled'); }} title="Notifications" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><BellRing className="w-6 h-6" style={{ stroke: `url(#bell-gradient-${accentColor})` }} /></button>
            {notifications.length > 0 && <span className="absolute top-[-2px] right-[-2px] w-4 h-4 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">{notifications.length}</span>}
            {isNotificationDropdownOpen && (
              <div className="absolute left-14 top-0 w-48 bg-white dark:bg-gray-950 rounded-lg shadow-md border border-gray-50 dark:border-gray-800 max-h-64 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div key={i} className="px-2 py-1 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-800 last:border-b-0" onClick={() => console.log(`Notification ${n.message} clicked`)}>
                    {n.message} <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { toggleProfileDropdown(); console.log('Profile toggled'); }} title="Profile" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><User className="w-6 h-6" /></button>
            {isProfileDropdownOpen && (
              <div className="absolute left-14 top-0 w-48 bg-white dark:bg-gray-950 rounded-lg shadow-md border border-gray-50 dark:border-gray-800">
                <Link to={`/profile/${user.username}`} onClick={() => { toggleProfileDropdown(); console.log('Navigated to Profile'); }} className="block px-2 py-1 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900">Profile</Link>
                <div className="px-2 py-1 text-sm font-sans text-gray-700 dark:text-gray-300">Accent Color: <div className="flex gap-1 mt-1"><button onClick={() => { changeAccentColor('purple'); console.log('Accent set to purple'); }} className="w-5 h-5 bg-purple-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300" /><button onClick={() => { changeAccentColor('teal'); console.log('Accent set to teal'); }} className="w-5 h-5 bg-teal-400 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-300" /><button onClick={() => { changeAccentColor('rose'); console.log('Accent set to rose'); }} className="w-5 h-5 bg-rose-600 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-300" /></div></div>
                <div className="px-2 py-1 text-sm font-sans text-gray-700 dark:text-gray-300 flex items-center gap-1">Dark Mode: <button onClick={() => { toggleDarkMode(); console.log('Dark mode toggled'); }} className="hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">{isDarkMode ? <Sun className="w-6 h-6" /> : <MoonStar className="w-6 h-6" />}</button></div>
                <button onClick={() => { toggleProfileDropdown(); alert('Logout to be implemented'); console.log('Logout clicked'); }} className="block w-full text-left px-2 py-1 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900">Logout</button>
              </div>
            )}
          </div>
        </div>
        <div><button onClick={() => { toggleDarkMode(); console.log('Dark mode toggled'); }} title="Toggle Dark Mode" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"><span className="sr-only">Toggle Dark Mode</span>{isDarkMode ? <Sun className="w-6 h-6" /> : <MoonStar className="w-6 h-6" />}</button></div>
      </div>
      <svg className="absolute w-0 h-0">
        <linearGradient id="home-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="home-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#6B46C1', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="home-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#E53E3E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="search-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#E53E3E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
        <linearGradient id="bell-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#E53E3E', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#38B2AC', stopOpacity: 1 }} /></linearGradient>
      </svg>
    </nav>
  );
};

export default Navbar;
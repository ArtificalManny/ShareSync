import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, BellRing, User, MoonStar, Sun, MessageCircle, Users, Tv2, Bookmark } from 'lucide-react';

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
        <div className="flex flex-col items-center space-y-4">
          <Link to="/" title="Home" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200" onClick={() => console.log('Navigated to Home')}><Home className="w-6 h-6" /></Link>
          <button onClick={() => { setIsSearchOpen(!isSearchOpen); console.log('Search toggled'); }} title="Search" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><Search className="w-6 h-6" /></button>
          <button onClick={() => { toggleNotificationDropdown(); console.log('Notifications toggled'); }} title="Alerts" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><BellRing className="w-6 h-6" /></button>
          <button onClick={() => console.log('Live TV clicked')} title="Live TV" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><Tv2 className="w-6 h-6" /></button>
          <button onClick={() => console.log('Messages clicked')} title="Messages" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><MessageCircle className="w-6 h-6" /></button>
          <button onClick={() => console.log('Groups clicked')} title="Groups" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><Users className="w-6 h-6" /></button>
          <button onClick={() => console.log('Feeds clicked')} title="Feeds" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><Bookmark className="w-6 h-6" /></button>
          <button onClick={() => { toggleProfileDropdown(); console.log('Profile toggled'); }} title="Profile" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-200"><User className="w-6 h-6" /></button>
        </div>
        <div><button onClick={() => { toggleDarkMode(); console.log('Dark mode toggled'); }} title="Toggle Dark Mode" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 focus:outline-none"><span className="sr-only">Toggle Dark Mode</span>{isDarkMode ? <Sun className="w-6 h-6" /> : <MoonStar className="w-6 h-6" />}</button></div>
      </div>
    </nav>
  );
};

export default Navbar;
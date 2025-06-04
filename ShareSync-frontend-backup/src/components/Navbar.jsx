import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { LogOut, User, Folder, Bell, Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ toggleTheme, currentTheme }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, notifications } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Defensive check for user.username
  const profileUrl = user && user.username ? `/profile/${user.username}` : '/login';

  return (
    <nav className="navbar glassmorphic">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-orbitron font-bold text-emerald-green focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
          >
            ShareSync
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-charcoal-gray hover:text-indigo-vivid transition-colors focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
            >
              {currentTheme === 'light' ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
            </button>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/projects"
                  className="flex items-center gap-2 text-saffron-yellow hover:text-charcoal-gray transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  aria-label="Go to projects"
                >
                  <Folder className="w-5 h-5" aria-hidden="true" /> Projects
                </Link>
                <Link
                  to={profileUrl}
                  className="flex items-center gap-2 text-saffron-yellow hover:text-charcoal-gray transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  aria-label="Go to profile"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  {user.profilePicture && (
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/24'}
                      alt="Profile"
                      className="w-6 h-6 rounded-full profile-pic"
                    />
                  )}
                  Profile
                </Link>
                <div className="relative">
                  <Bell className="w-5 h-5 text-saffron-yellow hover:text-charcoal-gray transition-colors" aria-hidden="true" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-vivid text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-saffron-yellow hover:text-charcoal-gray transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-saffron-yellow hover:text-charcoal-gray transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  aria-label="Go to login"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-saffron-yellow hover:text-charcoal-gray transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  aria-label="Go to register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
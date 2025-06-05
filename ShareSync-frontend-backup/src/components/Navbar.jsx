import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { LogOut, User, Folder, Bell, Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ toggleTheme, currentTheme }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, notifications, isLoading } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Ensure profile URL is set only when user is fully loaded
  const profileUrl = isAuthenticated && user && user.username ? `/profile/${user.username}` : '/login';

  if (isLoading) {
    return null; // Prevent rendering until authentication state is resolved
  }

  return (
    <nav className="navbar glassmorphic">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-orbitron font-bold text-emerald-green focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect animate-pulse"
            aria-label="Go to home"
          >
            ShareSync
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="nav-icon flex items-center gap-2 text-charcoal-gray hover:text-neon-coral transition-colors focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-orbit"
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
            >
              {currentTheme === 'light' ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
            </button>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/projects"
                  className="nav-icon flex items-center gap-2 text-saffron-yellow hover:text-neon-coral transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-slide-down"
                  aria-label="Go to projects"
                >
                  <Folder className="w-5 h-5" aria-hidden="true" /> Projects
                </Link>
                <Link
                  to={profileUrl}
                  className="nav-icon flex items-center gap-2 text-saffron-yellow hover:text-neon-coral transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-slide-down"
                  aria-label="Go to profile"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  {user.profilePicture && (
                    <div className="relative">
                      <img
                        src={user.profilePicture || 'https://via.placeholder.com/24'}
                        alt="Profile"
                        className="w-6 h-6 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
                    </div>
                  )}
                  Profile
                </Link>
                <div className="relative nav-icon">
                  <Bell className="w-5 h-5 text-saffron-yellow hover:text-neon-coral transition-colors animate-orbit" aria-hidden="true" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-crimson-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-bounce">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="nav-icon flex items-center gap-2 text-saffron-yellow hover:text-neon-coral transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-slide-down"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-icon text-saffron-yellow hover:text-neon-coral transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-slide-down"
                  aria-label="Go to login"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="nav-icon text-saffron-yellow hover:text-neon-coral transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-slide-down"
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
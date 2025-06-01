import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Home, Folder, User, LogOut, Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, theme, toggleTheme } = useContext(AuthContext);

  useEffect(() => {
    // Apply the theme to the document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glassmorphic">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo text-holo-blue font-inter text-2xl font-bold animate-text-glow">
          ShareSync
        </Link>
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/" className="navbar-link flex items-center gap-2" aria-label="Home">
                <Home className="w-5 h-5 text-holo-blue animate-pulse" aria-hidden="true" /> Home
              </Link>
              <Link to="/projects" className="navbar-link flex items-center gap-2" aria-label="Projects">
                <Folder className="w-5 h-5 text-holo-blue animate-pulse" aria-hidden="true" /> Projects
              </Link>
              <Link to={`/profile/${user?.username}`} className="navbar-link flex items-center gap-2" aria-label="Profile">
                <User className="w-5 h-5 text-holo-blue animate-pulse" aria-hidden="true" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="navbar-link flex items-center gap-2"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 text-holo-blue animate-pulse" aria-hidden="true" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" aria-label="Login">
                Login
              </Link>
              <Link to="/register" className="navbar-link" aria-label="Register">
                Register
              </Link>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="navbar-theme-toggle flex items-center gap-2"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-holo-blue animate-pulse" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
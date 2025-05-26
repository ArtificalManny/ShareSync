import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { Home, Folder, LogOut, Search, Bell, Settings as SettingsIcon, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, globalMetrics } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search functionality to be implemented');
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
        {/* Logo on the Left */}
        <Link to="/" className="text-xl font-inter text-holo-blue">
          ShareSync
        </Link>

        {/* Right Side: Icons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/" className="nav-link">
                <Home className="w-5 h-5 text-holo-blue" />
              </Link>
              <Link to="/projects" className="nav-link">
                <Folder className="w-5 h-5 text-holo-blue" />
              </Link>
              <div className="relative nav-link">
                <Bell className="w-5 h-5 text-holo-blue cursor-pointer" />
                {globalMetrics?.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-holo-pink text-holo-bg-dark text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {globalMetrics.notifications}
                  </span>
                )}
              </div>
              <Link to={`/profile/${user?.username || 'johndoe'}`} className="nav-link">
                <User className="w-5 h-5 text-holo-blue" />
              </Link>
              <Link to="/settings" className="nav-link">
                <SettingsIcon className="w-5 h-5 text-holo-blue" />
              </Link>
              <button onClick={handleLogout} className="nav-link">
                <LogOut className="w-5 h-5 text-holo-pink" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="nav-link">
                <User className="w-5 h-5 text-holo-blue" />
              </Link>
              <Link to="/register" className="nav-link">
                <User className="w-5 h-5 text-holo-blue" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
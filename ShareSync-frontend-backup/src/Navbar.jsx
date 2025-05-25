import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { Home, Folder, LogOut, Search, Bell, Settings, User } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="text-xl font-playfair text-accent-gold">
            ShareSync
          </Link>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative w-32">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent-teal" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="input-field w-full pl-8 pr-2 py-1 text-sm rounded-full"
                  />
                </div>
              </form>
            )}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link to="/" className="nav-link">
                  <Home className="w-5 h-5 text-accent-teal" />
                </Link>
                <Link to="/projects" className="nav-link">
                  <Folder className="w-5 h-5 text-accent-teal" />
                </Link>
                <Link to={`/profile/${user?.username || 'johndoe'}`} className="nav-link">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </Link>
                <Link to="/settings" className="nav-link">
                  <Settings className="w-5 h-5 text-accent-teal" />
                </Link>
                <div className="relative nav-link">
                  <Bell className="w-5 h-5 text-accent-teal cursor-pointer" />
                  {globalMetrics?.notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-coral text-primary text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {globalMetrics.notifications}
                    </span>
                  )}
                </div>
                <button onClick={handleLogout} className="nav-link">
                  <LogOut className="w-5 h-5 text-accent-coral" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="nav-link flex items-center">
                  <User className="w-5 h-5 text-accent-teal mr-1" /> Log In
                </Link>
                <Link to="/register" className="nav-link flex items-center">
                  <User className="w-5 h-5 text-accent-teal mr-1" /> Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
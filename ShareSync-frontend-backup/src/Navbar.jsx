import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { Home, Folder, LogOut, User, Search, Bell, Settings } from 'lucide-react';
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
        <div className="flex items-center justify-end h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-playfair text-accent-gold">
              ShareSync
            </Link>
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent-teal" />
                <input
                  type="text"
                  placeholder="Search projects, users..."
                  className="input-field w-full pl-10 pr-4 py-2 rounded-full"
                />
              </div>
            </form>
            {isAuthenticated ? (
              <>
                <Link to="/" className="nav-link">
                  <Home className="w-5 h-5 text-accent-teal" />
                </Link>
                <Link to="/projects" className="nav-link">
                  <Folder className="w-5 h-5 text-accent-teal" />
                </Link>
                <Link to={`/profile/${user?.username || 'johndoe'}`} className="nav-link flex items-center">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </Link>
                <Link to="/settings" className="nav-link">
                  <Settings className="w-5 h-5 text-accent-teal" />
                </Link>
                <div className="relative">
                  <Bell className="w-5 h-5 text-accent-teal cursor-pointer" />
                  {globalMetrics?.notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-coral text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {globalMetrics.notifications}
                    </span>
                  )}
                </div>
                <button onClick={handleLogout} className="nav-link">
                  <LogOut className="w-5 h-5 text-accent-coral" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <User className="w-5 h-5 text-accent-teal" />
                </Link>
                <Link to="/register" className="nav-link">
                  <User className="w-5 h-5 text-accent-teal" />
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
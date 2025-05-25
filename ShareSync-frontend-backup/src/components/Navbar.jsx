import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Home, Folder, LogOut, User, Search, Bell } from 'lucide-react';
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-playfair text-accent-gold">
              ShareSync
            </Link>
          </div>

          {/* Search Bar (Centered) */}
          <div className="flex-1 mx-6">
            <form onSubmit={handleSearch} className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent-teal" />
                <input
                  type="text"
                  placeholder="Search projects, users..."
                  className="input-field w-full pl-10 pr-4 py-2 rounded-full"
                />
              </div>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/" className="nav-link">
                  <Home className="w-5 h-5 text-accent-teal" />
                  <span className="ml-1">Home</span>
                </Link>
                <Link to="/projects" className="nav-link">
                  <Folder className="w-5 h-5 text-accent-teal" />
                  <span className="ml-1">Projects</span>
                </Link>
                <Link to={`/profile/${user?.username || 'johndoe'}`} className="nav-link flex items-center">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full mr-1 object-cover border border-accent-gold"
                  />
                  <span>Profile</span>
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
                  <span className="ml-1">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <User className="w-5 h-5 text-accent-teal" />
                  <span className="ml-1">Login</span>
                </Link>
                <Link to="/register" className="nav-link">
                  <User className="w-5 h-5 text-accent-teal" />
                  <span className="ml-1">Register</span>
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
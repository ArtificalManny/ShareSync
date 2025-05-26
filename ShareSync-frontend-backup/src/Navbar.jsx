import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { Home, Folder, LogOut, Search, Bell, Settings, User, Menu } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, globalMetrics } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="text-xl font-inter text-holo-blue">
          ShareSync
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-holo-pink" />
            <input
              type="text"
              placeholder="Search projects..."
              className="input-field pl-10 pr-3 py-2 w-full rounded-full text-holo-blue bg-holo-bg-light"
            />
          </div>
        </form>

        {/* Right Side: Icons and Links */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">
                <Home className="w-5 h-5 text-holo-blue" />
                <span className="nav-label">Home</span>
              </Link>
              <Link to="/projects" className="nav-link">
                <Folder className="w-5 h-5 text-holo-blue" />
                <span className="nav-label">Projects</span>
              </Link>
              <div className="relative nav-link">
                <Bell className="w-5 h-5 text-holo-blue cursor-pointer" />
                <span className="nav-label">Notifications</span>
                {globalMetrics?.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-holo-pink text-holo-bg-dark text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {globalMetrics.notifications}
                  </span>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="nav-link">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="nav-label">{user?.username || 'User'}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-holo-bg-light rounded-lg shadow-lg z-10">
                    <Link to={`/profile/${user?.username || 'johndoe'}`} className="block px-4 py-2 text-holo-blue hover:bg-holo-bg-dark">
                      Profile
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-holo-blue hover:bg-holo-bg-dark">
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-holo-pink hover:bg-holo-bg-dark">
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="nav-link">
                <User className="w-5 h-5 text-holo-blue mr-1" />
                <span className="nav-label">Log In</span>
              </Link>
              <Link to="/register" className="nav-link">
                <User className="w-5 h-5 text-holo-blue mr-1" />
                <span className="nav-label">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
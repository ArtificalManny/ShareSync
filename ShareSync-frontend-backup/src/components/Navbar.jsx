import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { LogOut, User, Folder } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-orbitron font-bold text-neon-magenta animate-text-glow focus:outline-none focus:ring-2 focus:ring-holo-silver">
            ShareSync
          </Link>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/projects"
                className="flex items-center gap-2 text-cyber-teal hover:text-holo-silver transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Go to projects"
              >
                <Folder className="w-5 h-5" aria-hidden="true" /> Projects
              </Link>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 text-cyber-teal hover:text-holo-silver transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Go to profile"
              >
                <User className="w-5 h-5" aria-hidden="true" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-cyber-teal hover:text-holo-silver transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-cyber-teal hover:text-holo-silver transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Go to login"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-cyber-teal hover:text-holo-silver transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Go to register"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
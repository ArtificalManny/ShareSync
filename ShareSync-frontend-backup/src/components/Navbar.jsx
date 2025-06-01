import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { LogOut, Home, Folder, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar bg-holo-bg-dark text-holo-gray p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-inter text-holo-blue font-bold">
          ShareSync
        </Link>
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/" className="flex items-center gap-2 text-holo-gray hover:text-holo-blue">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/projects" className="flex items-center gap-2 text-holo-gray hover:text-holo-blue">
                <Folder className="w-5 h-5" /> Projects
              </Link>
              <Link
                to={`/profile/${user?.username || ''}`}
                className="flex items-center gap-2 text-holo-gray hover:text-holo-blue"
              >
                <User className="w-5 h-5" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-holo-gray hover:text-holo-blue"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-holo-gray hover:text-holo-blue">
                Login
              </Link>
              <Link to="/register" className="text-holo-gray hover:text-holo-blue">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Home, Folder, User, LogOut, Sun, Moon, PlusCircle, Bell } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navigation-container">
      <div className="navigation-content">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
            <Home className="w-5 h-5" /> Home
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/projects" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
                <Folder className="w-5 h-5" /> Projects
              </Link>
              <Link to="/projects/create" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
                <PlusCircle className="w-5 h-5" /> Create Project
              </Link>
              <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
                <User className="w-5 h-5" /> Profile
              </Link>
              <Link to="/notifications" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
                <Bell className="w-5 h-5" /> Notifications
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-holo-bg-light text-holo-blue hover:text-holo-pink transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
              <User className="w-5 h-5" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
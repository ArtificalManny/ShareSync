import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import './Navbar.css';

const Navbar = ({ toggleTheme, theme }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ShareSync</Link>
      </div>
      <div className="navbar-links">
        <Link to="/projects">Projects</Link>
        {isAuthenticated && user && (
          <Link to={`/profile/${user.username}`}>
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-neon-cyan hover:border-neon-magenta transition-all"
            />
          </Link>
        )}
        {!isAuthenticated ? (
          <Link to="/login">Login</Link>
        ) : (
          <button onClick={() => {}} className="text-neon-cyan hover:text-neon-magenta transition-colors">Logout</button>
        )}
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
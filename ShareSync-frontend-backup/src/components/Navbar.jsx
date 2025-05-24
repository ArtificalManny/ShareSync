import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ toggleTheme, theme }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ShareSync</Link>
      </div>
      <div className="navbar-links">
        <Link to="/projects">Projects</Link>
        <Link to="/login">Login</Link>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Home, Folder, User, LogOut, Sun, Moon, PlusCircle, Bell, Search } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${searchQuery}`);
    }
  };

  if (isLoading) {
    return <nav className="navigation-container holographic-effect"><div className="navigation-content"><p>Loading...</p></div></nav>;
  }

  return (
    <nav className="navigation-container holographic-effect">
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
              <Link
                to={user?.username ? `/profile/${user.username}` : '/login'}
                className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all"
              >
                <User className="w-5 h-5" /> Profile
              </Link>
              <Link to="/notifications" className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all">
                <Bell className="w-5 h-5" /> Notifications
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="search-bar flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="input-field rounded-full"
              />
              <button onClick={handleSearch} className="btn-primary rounded-full">
                <Search className="w-5 h-5" />
              </button>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-holo-bg-light text-holo-blue hover:text-holo-pink transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAuthenticated ? (
            <>
              <img
                src={user?.profilePicture || 'https://via.placeholder.com/150'}
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-holo-blue animate-glow"
              />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-holo-blue hover:text-holo-pink transition-all"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </>
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
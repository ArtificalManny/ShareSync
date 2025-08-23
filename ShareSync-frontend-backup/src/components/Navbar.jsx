// /src/components/Navbar.jsx
import React, { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Folder, Settings, Sun, Moon, LogOut } from 'lucide-react';
import axios from 'axios';
import { getAccessToken } from '../utils/tokenUtils';
import { formatProfilePicture } from '../utils/imageUtils';

const DEFAULT_PIC = '/default-profile.png';

export default function Navbar({ user, setUser, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    if (typeof onLogout === 'function') return onLogout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAccessToken();
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('profilePicture', file);

      const { data } = await axios.post(
        'http://localhost:3000/api/profile/upload-profile-picture',
        fd,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser?.(data.user);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const itemClass = ({ isActive }) =>
    `group flex flex-col items-center rounded-xl p-2 outline-none
     ${isActive ? 'bg-slate-200/60 dark:bg-slate-800/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`;

  return (
    <nav className="fixed inset-y-0 left-0 w-16 md:w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between py-4 z-50 group">
      {/* PROFILE (avatar -> /me, camera button uploads) */}
      <div className="flex flex-col items-center space-y-1">
        <Link to="/me" className="relative group/avatar" aria-label="Open profile">
          <img
            src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC}
            alt={user?.firstName || 'User'}
            className="avatar"
          />

          {/* Upload indicator */}
          {uploading && (
            <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold bg-white/75 rounded-full">
              …
            </span>
          )}

          {/* Small camera button in corner */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 grid place-items-center h-6 w-6 rounded-full bg-white/90 border border-slate-300 text-[11px]"
            title="Change photo"
            aria-label="Change photo"
          >
            📷
          </button>
        </Link>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleChange}
          className="hidden"
        />

        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
          {user?.firstName || 'User'}
        </span>
      </div>

      {/* NAV LINKS (Profile button removed) */}
      <div className="flex flex-col items-center space-y-3">
        <NavLink to="/home" className={itemClass} aria-label="Home">
          <Home className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100">
            Home
          </span>
        </NavLink>

        <NavLink to="/projects" className={itemClass} aria-label="Projects">
          <Folder className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs opacity-0 group-hover:opacity-100">
            Projects
          </span>
        </NavLink>

        <NavLink to="/settings" className={itemClass} aria-label="Settings">
          <Settings className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          <span className="mt-1 text-xxs opacity-0 group-hover:opacity-100">
            Settings
          </span>
        </NavLink>
      </div>

      {/* TOGGLES */}
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={toggleDarkMode}
          className="group flex flex-col items-center focus:outline-none rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
          <span className="mt-1 text-xxs opacity-0 group-hover:opacity-100">
            {isDarkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="group flex flex-col items-center focus:outline-none rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Log out"
        >
          <LogOut className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <span className="mt-1 text-xxs opacity-0 group-hover:opacity-100">Logout</span>
        </button>
      </div>
    </nav>
  );
}

// src/components/MobileTabBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Folder, Plus, User } from 'lucide-react';

export default function MobileTabBar({ user }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath.startsWith(path);

  // Safely open the Command Palette via custom event we'll listen for
  const handleQuickAdd = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between h-16 px-6">
        
        <Link 
          to="/home" 
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive('/home') ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-zinc-400'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </Link>
        
        <Link 
          to="/projects" 
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors mr-2 ${isActive('/projects') ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-zinc-400'}`}
        >
          <Folder className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Projects</span>
        </Link>

        {/* Prominent Quick Add Button (Elevated) */}
        <div className="relative -top-5">
          <button
            onClick={handleQuickAdd}
            className="flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl shadow-violet-500/30 active:scale-95 transition-all outline-none"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ml-2 ${isActive('/profile') ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-zinc-400'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </Link>

      </div>
    </div>
  );
}

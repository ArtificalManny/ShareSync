// /src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 p-4 border-r border-slate-200">
      <nav className="space-y-2">
        <NavLink to="/home" className="block px-3 py-2 rounded hover:bg-slate-100">
          Home
        </NavLink>
        <NavLink to="/projects" className="block px-3 py-2 rounded hover:bg-slate-100">
          Projects
        </NavLink>
        {/* Updated: Profile points to /me */}
        <NavLink to="/me" className="block px-3 py-2 rounded hover:bg-slate-100">
          Profile
        </NavLink>
        <NavLink to="/settings" className="block px-3 py-2 rounded hover:bg-slate-100">
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

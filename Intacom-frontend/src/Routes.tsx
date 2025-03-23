import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import Projects from './Projects';
import Upload from './Upload';
import Settings from './Settings';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
}

interface RoutesProps {
  projects: Project[];
}

const AppRoutes: React.FC<RoutesProps> = ({ projects }) => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard projects={projects} />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/project/:id" element={<div>Project Page (Placeholder)</div>} />
    </Routes>
  );
};

export default AppRoutes;
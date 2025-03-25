import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import Upload from './Upload';
import Settings from './Settings';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface RoutesProps {
  projects: Project[] | undefined;
  showCreateProject: boolean;
  setShowCreateProject: (value: boolean) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  projectColor: string;
  setProjectColor: (value: string) => void;
  sharedUsers: { email: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  handleAddSharedUser: (email: string, role: 'Admin' | 'Editor' | 'Viewer') => void;
  handleRemoveSharedUser: (email: string) => void;
  handleCreateProject: (e: React.FormEvent) => void;
}

const AppRoutes: React.FC<RoutesProps> = ({
  projects,
  showCreateProject,
  setShowCreateProject,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectColor,
  setProjectColor,
  sharedUsers,
  handleAddSharedUser,
  handleRemoveSharedUser,
  handleCreateProject,
}) => {
  console.log('Rendering AppRoutes with projects:', projects);
  try {
    return (
      <Routes>
        <Route path="/" element={<div>Redirecting to login...</div>} />
        <Route
          path="/home"
          element={
            <Home
              projects={projects}
              showCreateProject={showCreateProject}
              setShowCreateProject={setShowCreateProject}
              projectName={projectName}
              setProjectName={setProjectName}
              projectDescription={projectDescription}
              setProjectDescription={setProjectDescription}
              projectColor={projectColor}
              setProjectColor={setProjectColor}
              sharedUsers={sharedUsers}
              handleAddSharedUser={handleAddSharedUser}
              handleRemoveSharedUser={handleRemoveSharedUser}
              handleCreateProject={handleCreateProject}
            />
          }
        />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/project/:id" element={<ProjectHome projects={projects} />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    );
  } catch (error) {
    console.error('Error rendering AppRoutes:', error);
    return <div>Error rendering routes. Please check the console for details.</div>;
  }
};

export default AppRoutes;
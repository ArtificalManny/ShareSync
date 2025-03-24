import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Upload from '../Upload';
import Settings from '../Settings';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface ProjectHomeProps {
  projects: Project[] | undefined;
}

const ProjectHome: React.FC<ProjectHomeProps> = ({ projects }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings'>('home');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`/projects/by-id/${id}`);
        setProject(response.data.data.project);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProject();
  }, [id]);

  if (!project) {
    return <div>Loading project...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{project.name}</h2>
      <p>{project.description || 'No description'}</p>
      <div className="project-tabs">
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('upload')}>Upload</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </div>
      {activeTab === 'home' && (
        <div>
          <h3>Project Home</h3>
          <p>Welcome to the {project.name} project page.</p>
        </div>
      )}
      {activeTab === 'upload' && <Upload />}
      {activeTab === 'settings' && <Settings />}
    </div>
  );
};

export default ProjectHome;
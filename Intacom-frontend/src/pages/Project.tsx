import React from 'react';
import { useParams } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  status?: 'current' | 'past';
}

interface ProjectProps {
  projects: Project[];
}

const Project: React.FC<ProjectProps> = ({ projects }) => {
  const { id } = useParams<{ id: string }>(); // Get the project ID from the URL
  const project = projects.find((p) => p._id === id);

  if (!project) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#f5f5f5' }}>Project not found.</div>;
  }

  return (
    <div className="project-container">
      <h2>{project.name}</h2>
      <p>{project.description || 'No description available'}</p>
      <p>Admin: {project.admin || 'Unknown'}</p>
      <p>Status: {project.status || 'Unknown'}</p>
      {project.sharedWith && project.sharedWith.length > 0 && (
        <div>
          <h3>Shared With:</h3>
          <ul>
            {project.sharedWith.map((user, index) => (
              <li key={index}>
                {user.userId} - {user.role}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Project;
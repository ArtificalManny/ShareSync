import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface ProjectsResponse {
  data?: Project[];
  [key: number]: Project;
  length?: number;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const response = await axios.get<ProjectsResponse>(`http://localhost:3000/projects/${user.username}`);
          const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
          setProjects(projectsData);
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          setProjects([]);
        }
      };
      fetchProjects();
    }
  }, [user]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('Rendering ProjectsPage');
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Projects</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1.5rem' }}>
        View and manage all your projects here.
      </p>
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            background: 'var(--secondary-color)',
            color: 'var(--text-color)',
            fontSize: '1rem',
          }}
        />
      </div>
      {filteredProjects.length === 0 ? (
        <p style={{ fontSize: '1rem', opacity: 0.8 }}>
          No projects found. Create a project to get started!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="project-card"
              style={{
                borderLeft: `4px solid ${project.color || '#3a3a50'}`,
              }}
            >
              <Link to={`/project/${project._id}`}>
                <h4>{project.name}</h4>
              </Link>
              <p>{project.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
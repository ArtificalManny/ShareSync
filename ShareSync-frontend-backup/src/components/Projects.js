import React, { useState, useEffect } from 'react';
import { getProjects } from '../services/project.service';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      }
    };
    fetchProjects();
  }, []);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Projects</h2>
      <Link to="/create-project">
        <button style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Create New Project
        </button>
      </Link>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {projects.map((project) => (
            <li key={project._id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>
              <strong>{project.title}</strong> - {project.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Projects;
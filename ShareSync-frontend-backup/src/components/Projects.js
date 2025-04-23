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
    <div>
      <h2>Projects</h2>
      <Link to="/create-project">
        <button>Create New Project</button>
      </Link>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project._id}>
              {project.title} - {project.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Projects;
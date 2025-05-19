import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/users/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="projects-container">
      <h1 className="text-white">Your Projects</h1>
      <div className="project-list">
        {Object.keys(projects).map(category => (
          projects[category].map(project => (
            <div key={project._id} className="project-card card">
              <h3 className="text-white">{project.title}</h3>
              <p className="text-gray">Category: {category}</p>
              <p className="text-gray">{project.description || 'No description available'}</p>
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default Projects;